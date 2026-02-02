'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    router.push(`/result/${data.jobId}`)
  }

  return (
    <main className="min-h-screen bg-washi flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-12">
        <h1 className="text-xl font-normal text-ink text-center tracking-[0.2em] leading-loose">
          ことのは綴り
        </h1>
        <p className="text-ink-muted text-sm text-center tracking-widest leading-relaxed">
          画像から俳句検索
        </p>

        <div className="space-y-8">
          <label className="block">
            <div
              className={`border border-washi-border border-dashed rounded-md p-10 md:p-14 text-center cursor-pointer transition-opacity duration-200 ${
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
                  <p className="text-ink-muted text-sm tracking-wide">選択済み</p>
                  <p className="text-ink-light text-xs tracking-wider">{file.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-ink-muted text-sm tracking-wide">画像を選択</p>
                  <p className="text-ink-faint text-xs tracking-wider">クリックまたはドロップ</p>
                </div>
              )}
            </div>
          </label>

          <button
            onClick={handleSubmit}
            disabled={!file}
            className={`w-full py-3.5 px-6 rounded-md text-sm font-normal tracking-wide transition-opacity duration-200 ${
              file
                ? 'bg-ink text-washi hover:opacity-90 cursor-pointer'
                : 'bg-washi-border text-ink-faint cursor-not-allowed opacity-60'
            }`}
          >
            検索を開始する
          </button>
        </div>
      </div>
    </main>
  )
}