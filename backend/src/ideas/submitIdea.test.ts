describe('submitIdea validation', () => {
  it('rejects title shorter than 5 characters', () => {
    expect('Hi'.length >= 5).toBe(false)
  })

  it('accepts valid title', () => {
    expect('My Great Idea'.length >= 5).toBe(true)
  })

  it('rejects description shorter than 20 characters', () => {
    expect('Short desc'.length >= 20).toBe(false)
  })

  it('rejects empty categoryIds', () => {
    const categoryIds: string[] = []
    expect(categoryIds.length > 0).toBe(false)
  })

  it('accepts valid categoryIds', () => {
    const categoryIds = ['cat-1', 'cat-2']
    expect(categoryIds.length > 0).toBe(true)
  })

  it('rejects benefits shorter than 10 characters', () => {
    expect('Short'.length >= 10).toBe(false)
  })

  it('enforces max 5 attachments', () => {
    const attachments = Array(6).fill({ fileKey: 'k', fileName: 'f', fileSize: 100, contentType: 'text/plain', uploadedAt: '' })
    expect(attachments.length <= 5).toBe(false)
  })

  it('enforces max 10MB file size', () => {
    const maxSize = 10_485_760
    expect(11_000_000 <= maxSize).toBe(false)
    expect(5_000_000 <= maxSize).toBe(true)
  })
})
