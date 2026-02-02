import { supabaseAdmin } from '../lib/supabase/admin'

async function importHaiku() {
  const text = `
古池や 蛙飛びこむ 水の音
夏草や 兵どもが 夢の跡
柿くへば 鐘が鳴るなり 法隆寺
`

  const haikus = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  for (const h of haikus) {
    const { error } = await supabaseAdmin
    .from('haikus')
    .upsert(
      {
        text: h,
        author: '青空文庫',
        embedding_status: 'pending',
      },
      { onConflict: 'text' } // ←ここが重複判定
    )

    if (error) {
      console.error('❌ insert failed:', h, error)
    } else {
      console.log('✅ inserted:', h)
    }
  }
}

importHaiku()