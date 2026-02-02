'use client'

import { useState, useEffect, useRef } from 'react'
import { JobStatus, GetJobResponse } from '../lib/types'

export function useJobPolling(jobId: string) {
  const [status, setStatus] = useState<JobStatus>(JobStatus.Processing)
  const [analysis, setAnalysis] = useState<GetJobResponse['analysis']>(undefined)
  const [searchResult, setSearchResult] = useState<GetJobResponse['searchResult']>(undefined)
  const [errorMessage, setErrorMessage] = useState<GetJobResponse['errorMessage']>(undefined)
  const statusRef = useRef<JobStatus>(JobStatus.Processing)


  useEffect(() => {
    if (!jobId) {
      return
    }

    // 初期状態にリセット
    setStatus(JobStatus.Processing)
    setSearchResult(undefined)
    setErrorMessage(undefined)
    statusRef.current = JobStatus.Processing

    const startTime = Date.now()
    const TIMEOUT_MS = 30000
    const POLL_INTERVAL_MS = 2000

    const pollJobStatus = async () => {
      // タイムアウトチェック
      if (Date.now() - startTime >= TIMEOUT_MS) {
        setStatus(JobStatus.Timeout)
        statusRef.current = JobStatus.Timeout
        return
      }

      // 既に終了状態なら何もしない
      if (
        statusRef.current === JobStatus.Success ||
        statusRef.current === JobStatus.Error ||
        statusRef.current === JobStatus.Timeout
      ) {
        return
      }

      try {
        const response = await fetch(`/api/images/${jobId}`)

        const data: GetJobResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.errorMessage ?? 'サーバエラーが発生しました')
        }
        
        setStatus(data.status)
        statusRef.current = data.status

        if (data.analysis) {
          setAnalysis(data.analysis)
        }

        if (data.searchResult) {
          setSearchResult(data.searchResult)
        }
        
        if (data.errorMessage) {
          setErrorMessage(data.errorMessage)
        }
      } catch (error) {
        setStatus(JobStatus.Error)
        statusRef.current = JobStatus.Error
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    // 初回実行
    pollJobStatus()

    // ポーリング開始
    const intervalId = setInterval(() => {
      // 終了状態ならポーリングを停止
      if (
        statusRef.current === JobStatus.Success ||
        statusRef.current === JobStatus.Error ||
        statusRef.current === JobStatus.Timeout
      ) {
        clearInterval(intervalId)
        return
      }

      pollJobStatus()
    }, POLL_INTERVAL_MS)

    // cleanup
    return () => {
      clearInterval(intervalId)
    }
  }, [jobId])

  return {
    status,
    analysis,
    searchResult,
    errorMessage,
  }
}
