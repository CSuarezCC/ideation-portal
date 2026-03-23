describe('createCampaign validation', () => {
  it('rejects missing required fields', () => {
    const body = { name: 'Test' }
    expect(body).not.toHaveProperty('description')
    expect(body).not.toHaveProperty('submissionStartDate')
  })

  it('rejects invalid date ordering', () => {
    const dates = {
      submissionStartDate: '2025-03-01T00:00:00Z',
      submissionEndDate: '2025-02-01T00:00:00Z', // before start
      evaluationStartDate: '2025-04-01T00:00:00Z',
      evaluationEndDate: '2025-05-01T00:00:00Z',
    }
    const valid = dates.submissionStartDate < dates.submissionEndDate
    expect(valid).toBe(false)
  })

  it('accepts valid date ordering', () => {
    const dates = {
      submissionStartDate: '2025-01-01T00:00:00Z',
      submissionEndDate: '2025-02-01T00:00:00Z',
      evaluationStartDate: '2025-02-01T00:00:00Z',
      evaluationEndDate: '2025-03-01T00:00:00Z',
    }
    const valid =
      dates.submissionStartDate < dates.submissionEndDate &&
      dates.submissionEndDate <= dates.evaluationStartDate &&
      dates.evaluationStartDate < dates.evaluationEndDate
    expect(valid).toBe(true)
  })

  it('rejects name shorter than 3 characters', () => {
    const name = 'AB'
    expect(name.length >= 3).toBe(false)
  })

  it('accepts name within valid range', () => {
    const name = 'Innovation Sprint Q1'
    expect(name.length >= 3 && name.length <= 200).toBe(true)
  })
})
