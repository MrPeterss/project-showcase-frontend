import { describe, expect, it } from 'vitest'
import { transformUser } from '@/store/slices/userSlice'

describe('userSlice', () => {
  describe('transformUser', () => {
    it('returns null for empty input', () => {
      expect(transformUser(null)).toBeNull()
      expect(transformUser(undefined)).toBeNull()
    })

    it('maps isAdmin to role when role is absent', () => {
      const u = transformUser({
        id: 1,
        email: 'a@b.edu',
        isAdmin: true,
      })
      expect(u?.role).toBe('ADMIN')
    })

    it('maps non-admin isAdmin to STUDENT when role absent', () => {
      const u = transformUser({
        id: 1,
        email: 'a@b.edu',
        isAdmin: false,
      })
      expect(u?.role).toBe('STUDENT')
    })

    it('preserves explicit role when present', () => {
      const u = transformUser({
        id: 2,
        email: 'c@d.edu',
        role: 'INSTRUCTOR',
        isAdmin: true,
      })
      expect(u?.role).toBe('INSTRUCTOR')
    })
  })
})
