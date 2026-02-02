// src/lib/jobStore.ts
import { Job, JobId, JobStatus, ImageAnalysisResult, SearchResult } from '../types'

class JobStore {
  private jobs = new Map<JobId, Job>()

  createJob(): Job {
    const job: Job = {
      id: crypto.randomUUID(),
      status: JobStatus.Processing,
      startedAt: Date.now(),
    }
    this.jobs.set(job.id, job)
    return job
  }

  getJob(id: JobId): Job | undefined {
    return this.jobs.get(id)
  }

  setSuccess(
    id: JobId,
    payload: { 
      analysis: ImageAnalysisResult
      searchResult: SearchResult
    }
  ) {
    const job = this.jobs.get(id)
    if (!job || job.status !== JobStatus.Processing) return

    job.status = JobStatus.Success
    job.finishedAt = Date.now()
    job.analysis = payload.analysis
    job.searchResult = payload.searchResult
  }

  setError(id: JobId, message: string) {
    const job = this.jobs.get(id)
    if (!job || job.status !== JobStatus.Processing) return

    job.status = JobStatus.Error
    job.finishedAt = Date.now()
    job.errorMessage = message
  }

  setTimeout(id: JobId) {
    const job = this.jobs.get(id)
    if (!job || job.status !== JobStatus.Processing) return

    job.status = JobStatus.Timeout
    job.finishedAt = Date.now()
  }
}

export const jobStore = new JobStore()