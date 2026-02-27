import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db/supabaseClient'
import { Haiku, Season } from '@/lib/types'

type UpdateKigoRequestBody = {
  kigo_text: string
  season: Exclude<Season, 'unknown'>
}

const ALLOWED_SEASONS: Exclude<Season, 'unknown'>[] = [
  'spring',
  'summer',
  'autumn',
  'winter',
  'newyear',
  'none',
]

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await req.json()) as UpdateKigoRequestBody

    if (!id) {
      return NextResponse.json(
        { errorMessage: 'haiku id が不正です' },
        { status: 400 }
      )
    }

    const kigoText = body.kigo_text?.trim()
    const season = body.season

    if (!kigoText) {
      return NextResponse.json(
        { errorMessage: 'kigo_text は必須です' },
        { status: 400 }
      )
    }

    if (!ALLOWED_SEASONS.includes(season)) {
      return NextResponse.json(
        { errorMessage: 'season が不正です' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('haikus')
      .update({
        kigo_text: kigoText,
        season,
        kigo_decided_by: 'manual',
        kigo_confidence: 1.0,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[POST /api/haiku/[id]/kigo] update error:', error)
      return NextResponse.json(
        { errorMessage: '季語の更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json(data as Haiku, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[POST /api/haiku/[id]/kigo] error:', message)
    return NextResponse.json(
      { errorMessage: message || '季語の更新に失敗しました' },
      { status: 500 }
    )
  }
}
