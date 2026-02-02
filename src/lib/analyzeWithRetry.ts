// src/lib/analyzeWithRetry.ts
import { analyzeImage } from './ai/analyzeImage'
import { ExternalImageAnalysisResponse } from './types'

export async function analyzeWithRetry(
  image: Blob,
  maxRetry = 2
): Promise<ExternalImageAnalysisResponse> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetry + 1; attempt++) {
    try {
      console.log(`[analyze] attempt ${attempt}`)
      return await analyzeImage(image)
    } catch (e) {
      lastError = e
      console.warn(`analyzeImage failed (attempt ${attempt})`, e)
    }
  }

  throw lastError
}