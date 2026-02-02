import { analyzeWithRetryAndTimeout } from '../analyzeWithRetryAndTimeout'
import { normalizeAnalysis } from './normalizeAnalysis'
import { translateToHaikuStyle } from './translateToHaikuStyle'
import { buildSearchInput } from './buildSearchInput'
import { searchHaiku } from '../search/searchHaiku'

export async function runHaikuPipeline(image: Blob) {
  // ① 安全に画像解析（retry + timeout込み）
  const external = await analyzeWithRetryAndTimeout(image, {
    timeoutMs: 15000,
    maxRetry: 2,
  })

  // ② 正規化
  const analysis = normalizeAnalysis(external)

  // ③ 日本語化（俳句世界観）
  const haikuAnalysis = await translateToHaikuStyle(analysis)

  // ④ embedding生成
  const searchInput = await buildSearchInput(haikuAnalysis)

  // ✅ SearchContextを作る
  const searchContext = {
    embedding: searchInput.embedding,
    keywords: haikuAnalysis.keywords,
    confidence: searchInput.confidence,
  }

  // ⑤ 俳句検索
  const searchResult = await searchHaiku(searchContext,haikuAnalysis)

  return {
    analysis: haikuAnalysis,
    searchResult,
  }
}