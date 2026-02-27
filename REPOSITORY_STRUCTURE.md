# kotonoha-tsuzuri リポジトリ構造（AI_Coding/kotonoha-tsuzuri）

## 1) 主要ディレクトリの役割

- **`src/app/`** … Next.js App Router。`page.tsx`（トップ：画像選択→検索開始）、`result/page.tsx`（結果表示）、`layout.tsx`、`globals.css`。**API ルート**は `src/app/api/images/` と `src/app/api/images/[jobId]/` の2本。
- **`src/app/api/`** … 画像投稿用 POST と job 状態取得用 GET のルートを配置。
- **`src/components/`** … 一覧に含まれるファイルは grep 結果に無し。必要に応じて追加される想定。
- **`src/lib/`** … コアロジック。`pipeline/`（画像解析→検索まで）、`search/`（keyword/embedding 検索）、`db/`（haikuRepository, supabaseClient）、`supabase/`（admin, client）、`ai/`（画像解析・キャプション・キーワード翻訳）、`store/`（jobStore）、`types.ts`、`confidenceMessage.ts` など。
- **`src/infrastructure/`** … 外部依存。`ai/embedding/embedText.ts`（Gemini Embedding API 呼び出し）。
- **`src/hooks/`** … `useJobPolling.ts` など（job ポーリング用。現状 POST が同期で結果を返すため未使用の可能性あり）。
- **`src/scripts/`** … バッチ・取り込み。`embedHaikus.ts`（pending 俳句の embedding 一括生成）、`importHaikuRaw.ts`（data/haiku_raw.txt から haikus 投入）、`importAozoraHaiku.ts`（サンプル俳句の upsert）。
- **`data/`** … `haiku_raw.txt`（1行1俳句の生データ）。取り込みは `importHaikuRaw.ts`。
- **`Haiku/`** … Python 側の俳句・季語関連（seq2seq、dataset/kigo の春夏秋冬・新年、models 等）。Next アプリのランタイムからは直接参照していない。
- **`public/`** … 静的ファイル（manifest.json, favicon 等）。
- **ルート直下** … `package.json`（Next 16, React 19, Supabase, next-pwa, tsx 等）、`embed:haiku` スクリプトあり。**マイグレーション用ディレクトリ（supabase/migrations 等）はリポジトリ内にない**。

---

## 2) API ルート一覧（エンドポイント・処理概要・依存）

| エンドポイント | メソッド | 処理概要 | 依存 |
|----------------|----------|----------|------|
| **`/api/images`** | POST | リクエストの `FormData` から `image` を取得 → `runHaikuPipeline(image)` で同期実行（画像解析→正規化→俳句風翻訳→embedding 生成→俳句検索）→ `{ analysis, searchResult }` を JSON で返す。画像なし or パイプライン失敗時は 400/500。 | `@/lib/pipeline/haikuPipeline`（内部で analyzeWithRetryAndTimeout, normalizeAnalysis, translateToHaikuStyle, buildSearchInput, searchHaiku）、画像解析は外部 API、embedding は Gemini。 |
| **`/api/images/[jobId]`** | GET | `jobStore.getJob(jobId)` で状態取得。30秒経過で Processing なら Timeout に変更。`analysis` と `searchResult` が揃っていれば Success に更新。レスポンスは `{ status, analysis?, searchResult?, errorMessage? }`。 | `@/lib/store/jobStore`、`@/lib/types`（JobStatus）。 |

※ 現状フロントは **POST /api/images のレスポンスを同期的に受け取り**、sessionStorage に保存して `/result` に遷移。GET `/api/images/[jobId]` は非同期 job 用の仕組みとして存在するが、POST が同期のため未使用。

---

## 3) DB / スキーマ / マイグレーションの場所と構造

- **場所**
  - 参照は **Supabase**。クライアント用: `src/lib/supabase/client.ts`（anon key）、サーバー・スクリプト用: `src/lib/supabase/admin.ts`（service role）、リポジトリ層: `src/lib/db/supabaseClient.ts`（service role で `haikuRepository` から利用）。
  - **スキーマ定義・マイグレーション用のファイルはリポジトリ内にない**（`supabase/migrations` 等なし）。スキーマは Supabase ダッシュボードで管理されているとみなせる。
- **構造（コード・スクリプトから分かる範囲）**
  - テーブル: **`haikus`**
  - 使用カラム:
    - **`id`** … 主キー。
    - **`text`** … 俳句本文。UNIQUE 制約あり（importAozoraHaiku の `onConflict: 'text'`）。
    - **`author`** … 作者。型定義（`Haiku`）にあり、importAozoraHaiku で設定。importHaikuRaw では未設定。
    - **`embedding_status`** … `'pending' | 'done' | 'error'`。embedHaikus が `pending` を処理して `done`/`error` に更新。
    - **`embedding_json`** … ベクトル（配列）。embedHaikus で Gemini Embedding API の結果を格納。
  - **季語（kigo）** … 現状コード上にカラムも型もなし。追加する場合はスキーマ変更が必要。

---

## 4) 俳句データの流れ（登録 → 検索 → 表示）

- **登録**
  1. **importHaikuRaw.ts** … `data/haiku_raw.txt` を 1 行 1 俳句で読み、`haikus` に `text`, `embedding_status: 'pending'` で insert（重複は UNIQUE でスキップ）。
  2. **importAozoraHaiku.ts** … 固定テキストを `text`, `author: '青空文庫'`, `embedding_status: 'pending'` で upsert（`onConflict: 'text'`）。
  3. **embedHaikus.ts** … `embedding_status = 'pending'` の行を取得し、`embedText(haiku.text)` で embedding を生成 → `embedding_json` と `embedding_status: 'done'` で update。失敗時は `'error'`。
- **検索**
  1. ユーザーがトップで画像を選択し「検索を開始する」→ `POST /api/images` に FormData で画像送信。
  2. **haikuPipeline**: 画像解析（外部 API）→ 正規化 → 俳句風日本語翻訳 → `buildSearchInput` でキャプションの embedding 取得 → **searchHaiku** で検索。
  3. **searchHaiku**: `fetchHaikus()` で全俳句取得。embedding が使えかつ confidence ≥ 0.3 なら **embedding 検索**（cosine 類似度上位 3 件）、それ以外は **keyword 検索**（俳句テキストにキーワードを含むものを最大 3 件）。`SearchResult`（haikus, method, totalCount 等）を返す。
  4. レスポンスを `sessionStorage.setItem('haikuResult', …)` し、`/result` へ push。
- **表示**
  1. **result/page.tsx** がマウント時に `sessionStorage.getItem('haikuResult')` から `analysis` と `searchResult` を復元。
  2. キャプション・キーワード・信頼度メッセージを表示し、`searchResult.haikus` をループで **俳句テキスト** と **作者（haiku.author）** を表示。keyword 検索時は「もっと見る」で 3 件ずつ追加表示。

---

## 5) 今回追加したい「作者 / 季語」機能に影響する箇所

- **型定義（`src/lib/types.ts`）**
  - **`Haiku`** に **`author`** は既存。**季語**用に `kigo?: string` または `kigo_id?: string` などを追加する必要がある。
- **DB・スキーマ**
  - **`haikus`** に **`kigo`**（または `kigo_id` で別テーブルと関連）を追加。リポジトリにマイグレーションを置く場合は `supabase/migrations/` を新設し SQL を追加。
  - **作者**は既にカラムあり。importHaikuRaw で作者を入れたい場合は insert に `author` を追加するか、別スクリプトで一括更新する必要がある。
- **データ取得**
  - **`src/lib/db/haikuRepository.ts`** の `fetchHaikus()` は `select('*')` のため、新カラム（kigo）を追加すればそのまま取得される。
  - 作者・季語で **絞り込み検索** を実装する場合は、`searchHaiku` または新規の検索関数で `.eq('author', …)` / `.eq('kigo', …)` などを付与する。
- **検索ロジック（`src/lib/search/searchHaiku.ts`）**
  - 現状は keyword と embedding のみ。**季語・作者でフィルタ**する場合は、`fetchHaikus()` の前後、または Supabase の filter で条件を追加する。
- **表示**
  - **`src/app/result/page.tsx`** … 既に `haiku.author` を表示している。**季語**を表示する場合は、各俳句ブロックに `haiku.kigo` などを表示するよう追加。
- **取り込みスクリプト**
  - **importHaikuRaw.ts** … 作者・季語を持たせる場合は、ファイル形式を拡張するか、別 CSV/JSON から読み、insert に `author`, `kigo` を含める。
  - **importAozoraHaiku.ts** … 必要に応じて `kigo` を upsert に追加。
  - **embedHaikus.ts** … 季語を embedding に含めるかは仕様次第（現状は `text` のみで embedding 生成）。
- **API**
  - POST `/api/images` の返却 `searchResult.haikus` は既に `Haiku[]` で author を含む。季語を追加した型にすればそのまま返る。
  - 将来「作者・季語で一覧/検索」用の API を追加する場合は、クエリパラメータで author/kigo を受け、上記フィルタをかける。
- **Haiku/（Python）**
  - `Haiku/dataset/kigo/` に季語データがある。季語のマスタや分類をここから取り込む場合は、スクリプトで読み込んで `haikus` の `kigo` を設定する運用が考えられる。

---

以上。
