// src/scripts/enrichKigo.ts
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../lib/supabase/admin'

const KIGO_DIR = path.join(process.cwd(), 'Haiku/dataset/kigo')

// DBに入れる season 値
type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'newyear'

// kigoディレクトリのファイル名 -> season
const seasonMap: Record<string, Season> = {
  spring: 'spring',
  summer: 'summer',
  autumn: 'autumn',
  winter: 'winter',
  new_year: 'newyear',
}

type KigoEntry = {
  season: Season
  word: string
  sourceFile: string
}

function loadKigoEntries(): KigoEntry[] {
  const files = fs.readdirSync(KIGO_DIR)

  const entries: KigoEntry[] = []

  for (const file of files) {
    const season = seasonMap[file]
    if (!season) continue // Untitledなどは無視

    const raw = fs.readFileSync(path.join(KIGO_DIR, file), 'utf-8')

    const words = raw
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    for (const word of words) {
      entries.push({ season, word, sourceFile: file })
    }
  }

  // 長い順（重要）
  entries.sort((a, b) => b.word.length - a.word.length)

  return entries
}

async function enrichKigo() {
  const entries = loadKigoEntries()
  console.log(`📚 kigo entries loaded: ${entries.length}`)

  // 未付与の俳句だけ対象
  const { data: haikus, error } = await supabaseAdmin
    .from('haikus')
    .select('id, text')
    .is('kigo_text', null)

  if (error) throw error

  console.log(`🧾 target haikus: ${haikus?.length ?? 0}`)

  let updated = 0
  let noHit = 0

  for (const haiku of haikus ?? []) {
    const hit = entries.find(e => haiku.text.includes(e.word))

    if (!hit) {
      noHit++
      continue
    }

    const { error: updateError } = await supabaseAdmin
      .from('haikus')
      .update({
        kigo_text: hit.word,
        season: hit.season,
        kigo_confidence: 0.8,
        kigo_decided_by: 'auto',
        kigo_source: hit.sourceFile,
      })
      .eq('id', haiku.id)

    if (updateError) {
      console.error('❌ update error:', updateError.message)
      continue
    }

    updated++
    if (updated % 200 === 0) {
      console.log(`✅ updated: ${updated}`)
    }
  }

  console.log('🎉 finished')
  console.log(`✅ updated: ${updated}`)
  console.log(`➖ no hit: ${noHit}`)
}

enrichKigo().catch(err => {
  console.error(err)
  process.exit(1)
})