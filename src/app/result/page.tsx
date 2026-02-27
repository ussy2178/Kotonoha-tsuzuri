'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { confidenceMessage } from '@/lib/confidenceMessage'
import { Haiku, ImageAnalysisResult, SearchResult, Season } from '@/lib/types'

/** 英語混在チェック（UI用ガード） */
function containsEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text)
}

const seasonLabel: Record<Exclude<Season, 'unknown'>, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
  newyear: '新年',
  none: '季語なし',
}

function toSeasonLabel(season: Season | null | undefined): string {
  if (!season || season === 'unknown') return '季節不明'
  return seasonLabel[season]
}

export default function ResultPage() {
  const router = useRouter()

  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [visibleCount, setVisibleCount] = useState(3)
  const [editingHaikuId, setEditingHaikuId] = useState<string | null>(null)
  const [kigoText, setKigoText] = useState('')
  const [season, setSeason] = useState<Exclude<Season, 'unknown'>>('spring')
  const [savingKigo, setSavingKigo] = useState(false)
  const [kigoError, setKigoError] = useState<string | null>(null)

  /** 初回マウント時に sessionStorage から結果を復元 */
  useEffect(() => {
    const raw = sessionStorage.getItem('haikuResult')

    if (!raw) {
      // 直アクセス・リロード対策
      router.push('/')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      setAnalysis(parsed.analysis)
      setSearchResult(parsed.searchResult)
    } catch (e) {
      console.error('[ResultPage] parse failed', e)
      router.push('/')
    }
  }, [router])

  if (!analysis || !searchResult) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-ink-muted text-sm tracking-wide">読み込み中…</p>
      </div>
    )
  }

  const haikus = searchResult.haikus ?? []
  const method = searchResult.method

  /** 表示用ガード */
  const caption =
    analysis.caption && !containsEnglish(analysis.caption)
      ? analysis.caption
      : null

  const keywords =
    analysis.keywords &&
    analysis.keywords.length > 0 &&
    analysis.keywords.every(k => !containsEnglish(k))
      ? analysis.keywords
      : null

  const openKigoModal = (haikuId: string) => {
    setEditingHaikuId(haikuId)
    setKigoText('')
    setSeason('spring')
    setKigoError(null)
  }

  const closeKigoModal = () => {
    setEditingHaikuId(null)
    setKigoText('')
    setSeason('spring')
    setKigoError(null)
  }

  const handleSaveKigo = async () => {
    if (!editingHaikuId) return
    if (!kigoText.trim()) {
      setKigoError('季語を入力してください')
      return
    }

    setSavingKigo(true)
    setKigoError(null)

    try {
      const response = await fetch(`/api/haiku/${editingHaikuId}/kigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kigo_text: kigoText.trim(),
          season,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message =
          payload?.errorMessage ?? '季語の保存に失敗しました'
        throw new Error(message)
      }

      const updatedHaiku = (await response.json()) as Haiku

      setSearchResult(prev => {
        if (!prev) return prev
        return {
          ...prev,
          haikus: prev.haikus.map(h =>
            h.id === updatedHaiku.id ? { ...h, ...updatedHaiku } : h
          ),
        }
      })

      closeKigoModal()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : '季語の保存に失敗しました'
      setKigoError(message)
    } finally {
      setSavingKigo(false)
    }
  }

  return (
    <div className="min-h-screen bg-washi text-ink">
      {editingHaikuId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-md bg-washi border border-washi-border p-6 space-y-4">
            <h3 className="text-sm tracking-wide text-ink">季語を設定する</h3>

            <div className="space-y-2">
              <label className="text-xs text-ink-light tracking-wide">
                季語テキスト
              </label>
              <input
                type="text"
                value={kigoText}
                onChange={(e) => setKigoText(e.target.value)}
                className="w-full rounded-md border border-washi-border bg-white/70 px-3 py-2 text-sm"
                placeholder="例：桜"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-ink-light tracking-wide">
                季節
              </label>
              <select
                value={season}
                onChange={(e) =>
                  setSeason(e.target.value as Exclude<Season, 'unknown'>)
                }
                className="w-full rounded-md border border-washi-border bg-white/70 px-3 py-2 text-sm"
              >
                <option value="spring">春</option>
                <option value="summer">夏</option>
                <option value="autumn">秋</option>
                <option value="winter">冬</option>
                <option value="newyear">新年</option>
                <option value="none">季語なし</option>
              </select>
            </div>

            {kigoError && (
              <p className="text-xs text-red-600 tracking-wide">{kigoError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeKigoModal}
                disabled={savingKigo}
                className="px-3 py-1.5 text-xs rounded-md border border-washi-border text-ink-light hover:opacity-80 disabled:opacity-60"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveKigo}
                disabled={savingKigo}
                className="px-3 py-1.5 text-xs rounded-md bg-ink text-washi hover:opacity-90 disabled:opacity-60"
              >
                {savingKigo ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-14">

        {/* タイトル */}
        <h1 className="text-xl font-normal text-ink text-center mb-14 tracking-[0.2em] leading-loose">
          ことのは綴り
        </h1>

        <div className="space-y-14">

          {/* Analysis */}
          <div className="space-y-6">

            {/* Caption */}
            {caption && (
              <div className="bg-washi-subtle rounded-md p-8 border border-washi-border text-center italic text-ink-muted text-[15px] leading-loose shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {caption}
              </div>
            )}

            {/* Keywords */}
            {keywords && (
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((k, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-md bg-washi-border/60 text-ink-muted tracking-wide"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}

            {/* Confidence message */}
            <p className="text-center text-sm text-ink-light tracking-wide">
              {confidenceMessage(analysis.confidence)}
            </p>
          </div>

          {/* 検索結果 */}
          {haikus.length > 0 ? (
            <div className="space-y-8">
              <div className="border-t border-washi-border pt-8">
                <h2 className="text-ink-light text-xs text-center font-normal tracking-[0.15em] uppercase">
                  検索結果
                </h2>
              </div>

              {haikus.slice(0, visibleCount).map((haiku) => (
                <div
                  key={haiku.id}
                  className="bg-washi-subtle border border-washi-border rounded-md p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-center text-[17px] leading-[2.2] mb-5 tracking-wide">
                    {haiku.text}
                  </p>
                  <p className="text-right text-xs text-ink-light tracking-wider">
                    {haiku.author}
                  </p>
                  <div className="mt-4 flex justify-end">
                    {haiku.kigo_text ? (
                      <span className="text-xs text-gray-500 tracking-wide">
                        季語｜{haiku.kigo_text}
                      </span>
                    ) : (
                      <button
                        className="text-xs text-gray-400 underline hover:text-gray-600 transition"
                        onClick={() => openKigoModal(haiku.id)}
                      >
                        季語を登録する
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* もっと見る（keyword検索のみ） */}
              {method === 'keyword' && haikus.length > visibleCount && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setVisibleCount(v => v + 3)}
                    className="text-ink-muted text-sm tracking-wide hover:opacity-70 transition-opacity"
                  >
                    もっと見る
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-ink-muted text-sm tracking-wide">
                該当する俳句が見つかりませんでした
              </p>
            </div>
          )}

          {/* 戻る */}
          <div className="text-center pt-12 border-t border-washi-border">
            <button
              onClick={() => router.push('/')}
              className="text-ink-muted text-sm tracking-wide hover:opacity-70 transition-opacity"
            >
              ← 最初に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}