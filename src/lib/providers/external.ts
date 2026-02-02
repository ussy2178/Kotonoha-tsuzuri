// src/lib/providers/external.ts
import { ExternalImageAnalysisResponse } from '../types'

const API_KEY = process.env.GOOGLE_VISION_API_KEY!

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

export async function analyzeImageExternal(
  image: Blob
): Promise<ExternalImageAnalysisResponse> {
  const base64Image = await blobToBase64(image)

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 5 },
              { type: 'IMAGE_PROPERTIES' },
            ],
          },
        ],
      }),
    }
  )

  const json = await res.json()
  // console.log('Google Vision raw:', JSON.stringify(json, null, 2))

  const labels = json.responses?.[0]?.labelAnnotations ?? []

  const keywords = labels.map((l: any) => l.description)

  return {
    caption: keywords.join('・'),
    keywords,
    confidence: labels[0]?.score ?? 0.5,
    raw: json,
  }
}