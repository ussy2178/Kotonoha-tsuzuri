import path from 'path'
import dotenv from 'dotenv'

// ★プロジェクトルートの.envを強制指定
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
})

console.log('ENV DEBUG')
console.log('cwd:', process.cwd())
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

import { supabaseAdmin } from '../lib/supabase/admin'
import { embedText } from '../infrastructure/ai/embedding/embedText'

async function embedHaikus() {
  console.log('▶ embedding batch start')

  // ① pendingの俳句を取得
  const { data: haikus, error } = await supabaseAdmin
    .from('haikus')
    .select('id, text')
    .eq('embedding_status', 'pending')
    .limit(500)

  if (error) {
    console.error('❌ fetch error:', error)
    return
  }

  if (!haikus || haikus.length === 0) {
    console.log('✅ pending haiku not found')
    return
  }

  console.log(`📌 target count: ${haikus.length}`)

  // ② 1件ずつembedding生成
  for (const haiku of haikus) {
    try {
      console.log(`⏳ embedding: ${haiku.text}`)

      const embedding = await embedText(haiku.text)

      if (embedding.length === 0) {
        throw new Error('embedding empty')
      }

      // ③ DB更新
      const { error: updateError } = await supabaseAdmin
        .from('haikus')
        .update({
          embedding_json: embedding,
          embedding_status: 'done',
        })
        .eq('id', haiku.id)

      if (updateError) {
        throw updateError
      }

      console.log(`✅ done: ${haiku.text}`)
    } catch (e) {
      console.error(`❌ failed: ${haiku.text}`, e)

      await supabaseAdmin
        .from('haikus')
        .update({ embedding_status: 'error' })
        .eq('id', haiku.id)
    }
  }

  console.log('🎉 embedding batch finished')
}

embedHaikus()