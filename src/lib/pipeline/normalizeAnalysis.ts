import { ExternalImageAnalysisResponse, ImageAnalysisResult } from '../types'

export function normalizeAnalysis(
  external: ExternalImageAnalysisResponse
): ImageAnalysisResult {
  console.log('[normalizeAnalysis.ts] external.confidence:', external.confidence)
  return {
    caption: external.caption,
    keywords: external.keywords,
    confidence: external.confidence,
  }
}