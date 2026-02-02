import { NextResponse } from 'next/server'
import { jobStore } from '@/lib/store/jobStore'
import { runHaikuPipeline } from '@/lib/pipeline/haikuPipeline'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('image')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '画像がありません' }, { status: 400 })
  }

  // ★ ① job を作る（jobId はここで確定）
  const job = jobStore.createJob()

  // 👇 awaitしない（fire-and-forget）
  runHaikuPipeline(file)
    .then((result) => {
      jobStore.setSuccess(job.id, result)
    })
    .catch((e) => {
      if (e.message.includes('タイムアウト')) {
        jobStore.setTimeout(job.id)
      } else {
        jobStore.setError(job.id, e.message)
      }
    })

// ★ ③ jobId を即返す（検索中画面に行ける）
return NextResponse.json({ jobId: job.id })}