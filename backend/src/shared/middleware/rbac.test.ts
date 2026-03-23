import { hasRole } from './rbac.js'

describe('hasRole', () => {
  it('ADMIN has all roles', () => {
    expect(hasRole('ADMIN', 'ADMIN')).toBe(true)
    expect(hasRole('ADMIN', 'PANEL_MEMBER')).toBe(true)
    expect(hasRole('ADMIN', 'EMPLOYEE')).toBe(true)
  })
  it('PANEL_MEMBER has EMPLOYEE but not ADMIN', () => {
    expect(hasRole('PANEL_MEMBER', 'PANEL_MEMBER')).toBe(true)
    expect(hasRole('PANEL_MEMBER', 'EMPLOYEE')).toBe(true)
    expect(hasRole('PANEL_MEMBER', 'ADMIN')).toBe(false)
  })
  it('EMPLOYEE only has EMPLOYEE', () => {
    expect(hasRole('EMPLOYEE', 'EMPLOYEE')).toBe(true)
    expect(hasRole('EMPLOYEE', 'PANEL_MEMBER')).toBe(false)
    expect(hasRole('EMPLOYEE', 'ADMIN')).toBe(false)
  })
})
