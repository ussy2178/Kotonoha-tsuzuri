'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)

  const messages = [
    '情景を読み取っています',
    'ことばを探しています',
    '俳句を探しています',
  ]

  // 擬似進捗（演出用）
  useEffect(() => {
    if (!loading) {
      setStep(0)
      return
    }

    const timer = setInterval(() => {
      setStep((s) => Math.min(s + 1, messages.length - 1))
    }, 1200)

    return () => clearInterval(timer)
  }, [loading])

  const handleSubmit = async () => {
    if (!file) return

    setLoading(true)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('API error')
      }

      const data = await response.json()

      // 結果を保存
      sessionStorage.setItem('haikuResult', JSON.stringify(data))

      // result ページへ
      router.push('/result')
    } catch (e) {
      console.error(e)
      alert('検索に失敗しました')
      setLoading(false)
    }
  }

  return (
    <>
      {/* 検索中オーバーレイ */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-washi/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-6 animate-fadeIn">
            <p className="text-ink-muted text-sm tracking-widest animate-pulse">
              {messages[step]}
            </p>
            <p className="text-ink-light text-xs tracking-wide">
              ことのは綴り
            </p>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-washi flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md space-y-12">

          <h1 className="text-xl font-normal text-ink text-center tracking-[0.2em] leading-loose">
            ことのは綴り
          </h1>

          <div className="space-y-8">

            {/* 画像選択 */}
            <label className="block">
              <div
                className={`border border-washi-border border-dashed rounded-md p-10 text-center cursor-pointer transition-opacity ${
                  file
                    ? 'bg-washi-subtle opacity-90'
                    : 'bg-washi hover:opacity-80'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const selected = e.target.files?.[0]
                    if (selected) setFile(selected)
                  }}
                />

                {file ? (
                  <div className="space-y-2">
                    <p className="text-ink-muted text-sm">選択済み</p>
                    <p className="text-ink-light text-xs">{file.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-ink-muted text-sm">画像を選択</p>
                    <p className="text-ink-faint text-xs">
                      クリックまたはドロップ
                    </p>
                  </div>
                )}
              </div>
            </label>

            {/* 送信ボタン */}
            <button
              onClick={handleSubmit}
              disabled={!file || loading}
              className={`w-full py-3.5 rounded-md text-sm tracking-wide transition-opacity ${
                loading
                  ? 'bg-washi-border text-ink-muted cursor-not-allowed'
                  : 'bg-ink text-washi hover:opacity-90'
              }`}
            >
              {loading ? '検索中…' : '検索を開始する'}
            </button>
          </div>
        </div>
      </main>
    </>
  )
}