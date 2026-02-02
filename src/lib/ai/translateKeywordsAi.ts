import { TranslatedKeyword } from '@/lib/types'

export async function aiTranslateKeywords(
  words: string[]
): Promise<TranslatedKeyword[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.log('[aiTranslateKeywords] api key missing')
    return words.map(word => ({
      original: word,
      translated: word,
      source: 'ai_fallback',
    }))
  }

  const prompt = `
次の英単語を、日本語の自然な単語に変換してください。
必ずすべての単語に対応する日本語を出力してください。
意味が分からない場合はカタカナ表記で構いません。

出力形式:
Sun=太陽
Afterglow=残光

英単語:
${words.join(', ')}
`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  )

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  if (!raw.trim()) {
    console.log('[aiTranslateKeywords] empty response')
    return words.map(word => ({
      original: word,
      translated: word,
      source: 'ai_fallback',
    }))
  }

  const lines = raw.split('\n')

  return words.map(word => {
    const line = lines.find((l: string) =>
      l.startsWith(`${word}=`)
    )
    if (!line) {
      return {
        original: word,
        translated: word,
        source: 'ai_fallback',
      }
    }

    return {
      original: word,
      translated: line.split('=')[1].trim(),
      source: 'ai',
    }
  })
}