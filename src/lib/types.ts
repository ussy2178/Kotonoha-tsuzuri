// src/lib/types.ts

/**
 * job の状態
 */
export enum JobStatus {
  Queued = 'queued',
  Processing = 'processing',
  Success = 'success',
  Error = 'error',
  Timeout = 'timeout',
}

/**
 * jobId（中身は文字列だが意味を持たせる）
 */
export type JobId = string

/**
 * 俳句データ
 */
export type Haiku = {
  id: string
  text: string
  author: string
  analysis?: ImageAnalysisResult
  embedding_json?: EmbeddingVector
  embedding?: EmbeddingVector
}

/**
 * job 全体
 */
export type Job = {
  id: JobId
  status: JobStatus

  startedAt: number
  finishedAt?: number
  searchResult?: SearchResult
  analysis?: ImageAnalysisResult
  errorMessage?: string
}

/**
 * POST /api/images のレスポンス
 */
export type CreateJobResponse = {
  jobId: JobId
}

export type ImageAnalysisResult = {
  caption: string
  keywords: string[]
  confidence: number
}

/**
 * GET /api/images/{jobId} のレスポンス
 */
export type GetJobResponse = {
  status: JobStatus
  analysis?: ImageAnalysisResult
  searchResult?: SearchResult
  errorMessage?: string
}

export type ExternalImageAnalysisResponse = {
  caption: string
  keywords: string[]
  confidence: number        // 0.0 ~ 1.0
  raw: unknown              // 外部APIの生レスポンス
}

/**
 * ベクトル表現（将来は embedding API の返り値）
 */
export type EmbeddingVector = number[]

export type SearchResult = {
  haikus: Haiku[]
  method: 'embedding' | 'keyword' | 'popular'
  reason?: string
  totalCount: number
}

export type KeywordSource =
  | 'dict'
  | 'ai'
  | 'ai_fallback'
  | 'original'

// src/lib/types.ts に追加してもOK
export type TranslatedKeyword = {
  original: string
  translated: string
  source: KeywordSource
}

export type SearchContext = {
  embedding: EmbeddingVector
  keywords: string[]
  confidence: number
}