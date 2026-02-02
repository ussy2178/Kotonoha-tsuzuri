'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useJobPolling } from '@/hooks/useJobPolling'
import { JobStatus } from '@/lib/types'
import { confidenceMessage } from '@/lib/confidenceMessage'

/** 英語混在チェック（UI用ガード） */
function containsEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text)
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()

  const jobId = Array.isArray(params.jobId)
    ? params.jobId[0]
    : params.jobId

  const [visibleCount, setVisibleCount] = useState(3)

  if (!jobId) {
    return (
      <div className="min-h-screen bg-washi flex items-center justify-center">
        <p className="text-ink-muted text-sm">jobId が取得できません</p>
      </div>
    )
  }

  const { status, analysis, errorMessage, searchResult } = useJobPolling(jobId)

  const method = searchResult?.method
  const haikus = searchResult?.haikus ?? []

  /** 表示用にガードした caption / keywords */
  const caption =
    analysis?.caption && !containsEnglish(analysis.caption)
      ? analysis.caption
      : null

  const keywords =
    analysis?.keywords &&
    analysis.keywords.length > 0 &&
    analysis.keywords.every(k => !containsEnglish(k))
      ? analysis.keywords
      : null

  console.log('[UI] searchResult:', searchResult)

  return (
    <div className="min-h-screen bg-washi text-ink">
      <div className="max-w-2xl mx-auto px-4 py-14">

        {/* タイトル */}
        <h1 className="text-xl font-normal text-ink text-center mb-14 tracking-[0.2em] leading-loose">
          ことのは綴り
        </h1>

        {/* Processing */}
        {status === JobStatus.Processing && (
          <div className="text-center py-24">
            <p className="text-ink-muted text-sm tracking-wide">検索中…</p>
          </div>
        )}

        {/* Error */}
        {status === JobStatus.Error && (
          <div className="text-center py-24 space-y-6">
            <p className="text-ink-muted text-sm">
              {errorMessage || 'エラーが発生しました'}
            </p>
            <Link href="/" className="text-ink-muted text-sm hover:opacity-70 transition-opacity">
              ← 最初に戻る
            </Link>
          </div>
        )}

        {/* Timeout */}
        {status === JobStatus.Timeout && (
          <div className="text-center py-24 space-y-6">
            <p className="text-ink-muted text-sm">
              タイムアウトしました
            </p>
            <Link href="/" className="text-ink-muted text-sm hover:opacity-70 transition-opacity">
              ← 最初に戻る
            </Link>
          </div>
        )}

        {/* Success */}
        {status === JobStatus.Success && (
          <div className="space-y-14">

            {/* Analysis */}
            {analysis && (
              <div className="space-y-6">

                {/* Caption（英語混在時は非表示） */}
                {caption && (
                  <div className="bg-washi-subtle rounded-md p-8 border border-washi-border text-center italic text-ink-muted text-[15px] leading-loose shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    {caption}
                  </div>
                )}

                {/* Keywords（英語混在時は非表示） */}
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

                {/* confidenceMessage は常に表示 */}
                <p className="text-center text-sm text-ink-light tracking-wide">
                  {confidenceMessage(analysis.confidence)}
                </p>
              </div>
            )}

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
        )}
      </div>
    </div>
  )
}