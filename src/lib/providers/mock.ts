import { ExternalImageAnalysisResponse } from '../types'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function analyzeImageMock(
  image: Blob
): Promise<ExternalImageAnalysisResponse> {
  // 擬似的に時間がかかる処理
  await sleep(1500)

  // 擬似的に失敗させる（retry確認用）
  if (Math.random() < 0.2) {
    throw new Error('画像解析に失敗しました')
  }

  const result = {
    caption: '雪の積もった静かな庭',
    keywords: ['雪', '庭', '静寂'],
    confidence: Math.random(), // 0.0〜1.0
    // confidence: 0.2,
    raw: {
      model: 'dummy-vision-api-v1',
      imageSize: image.size,
      imageType: image.type,
      elapsedMs: 1500,
    },
  }
  console.log('[mock.ts] confidence:', result.confidence)
  // 外部APIっぽいレスポンス
  return result
}