import { NextResponse } from 'next/server'
import { jobStore } from '@/lib/store/jobStore'
import { JobStatus } from '@/lib/types'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const job = jobStore.getJob(jobId)
  // console.log('[GET API] job.searchResult:', job?.searchResult)

  if (!job) {
    return NextResponse.json(
      { status: JobStatus.Error, errorMessage: 'job が見つかりません' },
      { status: 404 }
    )
  }

  // timeout 判定
  const elapsed = Date.now() - job.startedAt
  if (elapsed > 30000 && job.status === JobStatus.Processing) {
    job.status = JobStatus.Timeout
  }

  return NextResponse.json({
    status: job.status,
    analysis: job.analysis,
    searchResult: job.searchResult,
    errorMessage: job.errorMessage,
  })
}