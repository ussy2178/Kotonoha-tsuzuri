// src/lib/analyzeImage.ts
import { analyzeImageMock } from '../providers/mock'
import { analyzeImageExternal } from '../providers/external'
import { ImageAnalysisResult } from '../types'
import { ExternalImageAnalysisResponse } from '../types'

const PROVIDER = process.env.IMAGE_ANALYSIS_PROVIDER ?? 'mock'

export async function analyzeImage(image: Blob): Promise<ExternalImageAnalysisResponse> {
  // ① provider を選ぶ
  const result =
    PROVIDER === 'external'
      ? await analyzeImageExternal(image) // externalなら外部APO
      : await analyzeImageMock(image) // mockならモックA

  // ② データの形を保証する
  return {
    caption: result.caption ?? '',
    keywords: result.keywords ?? [],
    confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
    raw: result.raw ?? result,
  }
}