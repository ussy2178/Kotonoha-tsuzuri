import { haikuDict } from '../haikuDictionary'
import { aiTranslateKeywords } from '../ai/translateKeywordsAi'
import { TranslatedKeyword } from '../types'

export async function translateKeywords(
  keywords: string[]
): Promise<TranslatedKeyword[]> {
  const dictResults: (TranslatedKeyword | null)[] = keywords.map(word => {
    const key = word.toLowerCase()
    if (haikuDict[key]) {
      return {
        original: word,
        translated: haikuDict[key],
        source: 'dict',
      }
    }
    return null
  })

  const needAI = keywords.filter((_, i) => !dictResults[i])

  const aiResults =
    needAI.length > 0 ? await aiTranslateKeywords(needAI) : []

  let aiIndex = 0

  const merged = dictResults.map(result => {
    if (result) return result
    return (
      aiResults[aiIndex++] ?? {
        original: '',
        translated: '',
        source: 'ai_fallback',
      }
    )
  })

  console.log('[translate] keywords:', merged)

  return merged
}