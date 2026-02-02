import { ImageAnalysisResult, EmbeddingVector } from '../types'
import { embedText } from '@/infrastructure/ai/embedding/embedText'

export type SearchInput = {
  embedding: EmbeddingVector
  confidence: number
}

export async function buildSearchInput(
  analysis: ImageAnalysisResult
): Promise<SearchInput> {
  console.log('[buildSearchInput] caption:', analysis.caption)

  const embedding = await embedText(analysis.caption)

  console.log('[buildSearchInput] embedding length:', embedding.length)
  console.log('[buildSearchInput] embedding sample:', embedding.slice(0, 5))
  console.log('[buildSearchInput] caption:', analysis.caption)
  console.log('[buildSearchInput] caption length:', analysis.caption?.length)

  return {
    embedding,
    confidence: analysis.confidence,
  }
}