// src/lib/analyzeWithRetryAndTimeout.ts
import { analyzeWithRetry } from './analyzeWithRetry'
import { timeoutPromise } from './timeout'
import { ImageAnalysisResult } from './types'
import { ExternalImageAnalysisResponse } from './types'


export async function analyzeWithRetryAndTimeout(
  image: Blob,
  options?: {
    timeoutMs?: number
    maxRetry?: number
  }
): Promise<ExternalImageAnalysisResponse> {
  const timeoutMs = options?.timeoutMs ?? 15000
  const maxRetry = options?.maxRetry ?? 2

  // 「retry付き解析」と「タイムアウト」を同時に走らせる
  return Promise.race([
    analyzeWithRetry(image, maxRetry),
    timeoutPromise(timeoutMs),
  ])
}