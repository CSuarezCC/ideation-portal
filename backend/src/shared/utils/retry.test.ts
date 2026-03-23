import { withRetry } from './retry.js'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on retryable error and succeeds', async () => {
    const throttleError = Object.assign(new Error('ThrottlingException'), { name: 'ThrottlingException' })
    const fn = jest.fn()
      .mockRejectedValueOnce(throttleError)
      .mockResolvedValue('ok')
    const result = await withRetry(fn, 3)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws immediately on non-retryable error', async () => {
    const err = new Error('SomeOtherError')
    const fn = jest.fn().mockRejectedValue(err)
    await expect(withRetry(fn, 3)).rejects.toThrow('SomeOtherError')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
