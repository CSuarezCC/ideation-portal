const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const retryableCodes = ['ProvisionedThroughputExceededException', 'RequestLimitExceeded', 'ServiceUnavailable', 'ThrottlingException']
    return retryableCodes.some((code) => err.name === code || err.message.includes(code))
  }
  return false
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries || !isRetryable(err)) throw err
      await sleep(Math.pow(2, attempt) * 100)
    }
  }
  // unreachable but satisfies TypeScript
  throw new Error('Retry exhausted')
}
