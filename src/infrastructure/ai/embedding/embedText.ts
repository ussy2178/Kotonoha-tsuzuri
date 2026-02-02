import { EmbeddingVector } from '@/lib/types'

export async function embedText(text: string): Promise<EmbeddingVector> {
  if (!text || text.trim().length === 0) {
    console.error('[embedCaption] empty text, skip embedding')
    return []
  }
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  console.log('[embedCaption] text:', text)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    }
  )

  const data = await res.json()

  console.log('[embedCaption] status:', res.status)
  console.log('[embedCaption] embedding length:', data.embedding?.values?.length)

  if (!res.ok || !data.embedding?.values) {
    throw new Error('Embedding failed')
  }

  return data.embedding.values
}