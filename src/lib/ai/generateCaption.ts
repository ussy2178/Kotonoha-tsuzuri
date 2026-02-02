// src/lib/ai/generateCaption.ts
export async function generateCaption(words: string[]): Promise<string> {
  // ① 防御：入力が空
  if (!words || words.length === 0) {
    console.warn('[generateCaption] empty words, fallback')
    return ''
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[generateCaption] GEMINI_API_KEY not set')
    return `${words.join('、')}が印象に残る情景`
  }

  const prompt = `
あなたは「俳句検索用の情景文」を生成するAIです。

次の日本語単語をすべて使って、
自然な日本語の情景文を【必ず1文】で生成してください。

【必須条件】
- 20文字以上40文字以下
- 単語はすべて意味として反映すること
- 主語は省略してよい
- 説明文ではなく「情景描写」
- 名詞だけで終わらせない

【単語】
${words.join('、')}

【出力形式】
文章のみを1文で出力してください。
`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 80,
          },
        }),
      }
    )

    const data = await res.json()
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    console.log('[generateCaption] raw caption:', text)

    // ② Gemini が黙った or 破綻した
    if (!text) {
      const fallback = `${words.join('、')}が印象に残る情景`
      console.warn('[generateCaption] empty response, fallback:', fallback)
      return fallback
    }

    // ③ 短すぎる場合は「補強 fallback」
    if (text.length < 15) {
      const fallback = `${text}が静かに広がる情景`
      console.warn('[generateCaption] too short, fallback:', fallback)
      return fallback
    }

    return text
  } catch (e) {
    console.error('[generateCaption] error:', e)
    return `${words.join('、')}が印象に残る情景`
  }
}