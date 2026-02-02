import { ImageAnalysisResult } from '../types'
import { translateKeywords } from './translateKeywords'
import { generateCaption } from '../ai/generateCaption'

export async function translateToHaikuStyle(
  analysis: ImageAnalysisResult
): Promise<ImageAnalysisResult> {

  const translatedKeywords = await translateKeywords(analysis.keywords)

  const caption = await generateCaption(
    translatedKeywords.map(k => k.translated)
  )

  console.log('[translate] keywords:', translatedKeywords)
  console.log('[translate] sceneCaption:', caption)

  return {
    caption,
    keywords: translatedKeywords.map(k => k.translated),
    confidence: analysis.confidence,
  }
}