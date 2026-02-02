import { Haiku, EmbeddingVector, ImageAnalysisResult, SearchResult } from '../types'
import { fetchHaikus } from '../db/haikuRepository'
import { SearchInput } from '../pipeline/buildSearchInput'
import { cosineSimilarity } from './similarity'

/**
 * util: ベクトルノルム（確認用）
 */
function vectorNorm(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0))
}

/**
 * keyword検索（全件返す）
 */
export async function searchHaikuByKeywords(
  keywords: string[]
): Promise<Haiku[]> {
  const haikus = await fetchHaikus()

  const matched = haikus.filter((haiku) =>
    keywords.some((keyword) => haiku.text.includes(keyword))
  )

  console.log('[keyword search] keywords:', keywords)
  console.log('[keyword search] total matched:', matched.length)

  return matched
}

/**
 * embedding検索（上位3件のみ返す）
 */
export async function searchHaikuByEmbedding(
  embedding: EmbeddingVector
): Promise<Haiku[]> {
  if (!embedding || embedding.length === 0) {
    console.log('[embedding search] embedding empty')
    return []
  }

  console.log('[embedding search] query embedding length:', embedding.length)
  console.log(
    '[embedding search] query embedding sample:',
    embedding.slice(0, 8)
  )
  console.log(
    '[embedding search] query embedding norm:',
    vectorNorm(embedding).toFixed(4)
  )

  const haikus = await fetchHaikus()

  const withEmbedding = haikus.filter(
    (h) => Array.isArray(h.embedding_json) && h.embedding_json.length > 0
  )

  console.log(
    '[embedding search] haikus with embedding:',
    withEmbedding.length
  )

  if (withEmbedding.length === 0) {
    return []
  }

  // DB側 embedding のサンプル確認
  console.log(
    '[embedding search] sample DB embedding length:',
    withEmbedding[0].embedding_json?.length
  )
  console.log(
    '[embedding search] sample DB embedding sample:',
    withEmbedding[0].embedding_json?.slice(0, 8)
  )

  const scored = withEmbedding.map((h) => ({
    haiku: h,
    score: cosineSimilarity(embedding, h.embedding_json!),
  }))

  scored.sort((a, b) => b.score - a.score)

  // 上位スコア確認（超重要）
  console.log('[embedding search] top scores:')
  scored.slice(0, 5).forEach((s, i) => {
    console.log(
      `  [rank ${i}] score=${s.score.toFixed(4)} text="${s.haiku.text.slice(0, 20)}"`
    )
  })

  return scored.slice(0, 3).map((s) => s.haiku)
}

/**
 * 検索統合
 */
export async function searchHaiku(
  input: SearchInput,
  analysis: ImageAnalysisResult
): Promise<SearchResult> {

  const hasEmbedding =
    Array.isArray(input.embedding) && input.embedding.length > 0

  console.log('[search] hasEmbedding:', hasEmbedding)
  console.log('[search] confidence:', input.confidence)
  console.log('[search] caption:', analysis.caption)
  console.log('[search] caption length:', analysis.caption?.length)

  /**
   * ① embeddingを使えないケース
   */
  if (!hasEmbedding || input.confidence < 0.3) {
    console.log('[search] fallback to keyword search')

    const all = await searchHaikuByKeywords(analysis.keywords)

    return {
      haikus: all.slice(0, 3),
      totalCount: all.length,
      method: 'keyword',
      reason: !hasEmbedding
        ? 'embeddingが存在しない'
        : 'confidenceが低い',
    }
  }

  /**
   * ② embedding検索
   */
  console.log('[search] try embedding search')

  const embeddingResults = await searchHaikuByEmbedding(input.embedding!)

  if (embeddingResults.length === 0) {
    console.log('[search] embedding result empty → keyword fallback')

    const all = await searchHaikuByKeywords(analysis.keywords)

    return {
      haikus: all.slice(0, 3),
      totalCount: all.length,
      method: 'keyword',
      reason: 'embedding検索結果が0件',
    }
  }

  console.log('[search] embedding search success')

  return {
    haikus: embeddingResults,
    totalCount: embeddingResults.length,
    method: 'embedding',
  }
}