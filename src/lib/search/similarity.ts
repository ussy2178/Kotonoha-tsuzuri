import { EmbeddingVector } from '../types'

export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  let sum = 0

  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }

  return sum
}