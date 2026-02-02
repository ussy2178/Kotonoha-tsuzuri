import { NextResponse } from 'next/server'
import { runHaikuPipeline } from '@/lib/pipeline/haikuPipeline'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json({ errorMessage: '画像がありません' }, { status: 400 })
    }

    // ✅ 同期で最後まで処理して結果を返す
    const result = await runHaikuPipeline(file)

    // result の形が不明なので、まずはそのまま返す（後で整える）
    // 期待形: { analysis, searchResult }
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[POST /api/images] error:', message)

    return NextResponse.json(
      { errorMessage: message || '検索に失敗しました' },
      { status: 500 }
    )
  }
}