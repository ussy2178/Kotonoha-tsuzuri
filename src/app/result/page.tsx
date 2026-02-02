'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { confidenceMessage } from '@/lib/confidenceMessage'
import { ImageAnalysisResult, SearchResult } from '@/lib/types'

/** 英語混在チェック（UI用ガード） */
function containsEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text)
}

export default function ResultPage() {
  const router = useRouter()

  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [visibleCount, setVisibleCount] = useState(3)

  /** 初回マウント時に sessionStorage から結果を復元 */
  useEffect(() => {
    const raw = sessionStorage.getItem('haikuResult')

    if (!raw) {
      // 直アクセス・リロード対策
      router.push('/')
      return
    }

    try {
      const parsed = JSON.parse(raw)
      setAnalysis(parsed.analysis)
      setSearchResult(parsed.searchResult)
    } catch (e) {
      console.error('[ResultPage] parse failed', e)
      router.push('/')
    }
  }, [router])

  if (!analysis || !searchResult) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-ink-muted text-sm tracking-wide">読み込み中…</p>
      </div>
    )
  }

  const haikus = searchResult.haikus ?? []
  const method = searchResult.method

  /** 表示用ガード */
  const caption =
    analysis.caption && !containsEnglish(analysis.caption)
      ? analysis.caption
      : null

  const keywords =
    analysis.keywords &&
    analysis.keywords.length > 0 &&
    analysis.keywords.every(k => !containsEnglish(k))
      ? analysis.keywords
      : null

  return (
    <div className="min-h-screen bg-washi text-ink">
      <div className="max-w-2xl mx-auto px-4 py-14">

        {/* タイトル */}
        <h1 className="text-xl font-normal text-ink text-center mb-14 tracking-[0.2em] leading-loose">
          ことのは綴り
        </h1>

        <div className="space-y-14">

          {/* Analysis */}
          <div className="space-y-6">

            {/* Caption */}
            {caption && (
              <div className="bg-washi-subtle rounded-md p-8 border border-washi-border text-center italic text-ink-muted text-[15px] leading-loose shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {caption}
              </div>
            )}

            {/* Keywords */}
            {keywords && (
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((k, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs rounded-md bg-washi-border/60 text-ink-muted tracking-wide"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}

            {/* Confidence message */}
            <p className="text-center text-sm text-ink-light tracking-wide">
              {confidenceMessage(analysis.confidence)}
            </p>
          </div>

          {/* 検索結果 */}
          {haikus.length > 0 ? (
            <div className="space-y-8">
              <div className="border-t border-washi-border pt-8">
                <h2 className="text-ink-light text-xs text-center font-normal tracking-[0.15em] uppercase">
                  検索結果
                </h2>
              </div>

              {haikus.slice(0, visibleCount).map((haiku) => (
                <div
                  key={haiku.id}
                  className="bg-washi-subtle border border-washi-border rounded-md p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                >
                  <p className="text-center text-[17px] leading-[2.2] mb-5 tracking-wide">
                    {haiku.text}
                  </p>
                  <p className="text-right text-xs text-ink-light tracking-wider">
                    {haiku.author}
                  </p>
                </div>
              ))}

              {/* もっと見る（keyword検索のみ） */}
              {method === 'keyword' && haikus.length > visibleCount && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setVisibleCount(v => v + 3)}
                    className="text-ink-muted text-sm tracking-wide hover:opacity-70 transition-opacity"
                  >
                    もっと見る
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-ink-muted text-sm tracking-wide">
                該当する俳句が見つかりませんでした
              </p>
            </div>
          )}

          {/* 戻る */}
          <div className="text-center pt-12 border-t border-washi-border">
            <button
              onClick={() => router.push('/')}
              className="text-ink-muted text-sm tracking-wide hover:opacity-70 transition-opacity"
            >
              ← 最初に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}