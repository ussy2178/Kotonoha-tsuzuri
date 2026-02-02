// src/lib/timeout.ts

export function timeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('解析がタイムアウトしました'))
    }, ms)
  })
}