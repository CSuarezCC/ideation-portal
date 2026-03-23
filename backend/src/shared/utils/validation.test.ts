import { isValidEmail, isValidPassword } from './validation.js'

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@domain.co')).toBe(true)
  })
  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('accepts valid passwords', () => {
    expect(isValidPassword('Password1')).toBe(true)
    expect(isValidPassword('Str0ngPass')).toBe(true)
  })
  it('rejects short passwords', () => {
    expect(isValidPassword('Pass1')).toBe(false)
  })
  it('rejects passwords without uppercase', () => {
    expect(isValidPassword('password1')).toBe(false)
  })
  it('rejects passwords without digit', () => {
    expect(isValidPassword('Password')).toBe(false)
  })
})
