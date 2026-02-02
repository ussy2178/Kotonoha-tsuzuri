// src/scripts/importHaikuRaw.ts
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../lib/supabase/admin'

const FILE_PATH = path.join(process.cwd(), 'data/haiku_raw.txt')

async function importHaikuRaw() {
  const raw = fs.readFileSync(FILE_PATH, 'utf-8')

  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  console.log(`📘 total lines: ${lines.length}`)

  let inserted = 0
  let skipped = 0

  for (const text of lines) {
    const { error } = await supabaseAdmin
      .from('haikus')
      .insert({
        text,
        embedding_status: 'pending',
      })

    if (error) {
      // UNIQUE制約で弾かれたらスキップ
      if (error.code === '23505') {
        skipped++
      } else {
        console.error('❌ insert error:', error.message)
      }
    } else {
      inserted++
      if (inserted % 100 === 0) {
        console.log(`✅ inserted ${inserted}`)
      }
    }
  }

  console.log('🎉 finished')
  console.log(`✅ inserted: ${inserted}`)
  console.log(`⏭ skipped (duplicate): ${skipped}`)
}

importHaikuRaw()