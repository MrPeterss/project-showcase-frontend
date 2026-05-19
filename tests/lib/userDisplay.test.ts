import { describe, expect, it } from 'vitest'
import { userDisplayLabel } from '@/lib/userDisplay'

describe('userDisplay', () => {
  describe('userDisplayLabel', () => {
    it('returns empty for null/undefined', () => {
      expect(userDisplayLabel(null)).toBe('')
      expect(userDisplayLabel(undefined)).toBe('')
    })

    it('prefers trimmed name over email', () => {
      expect(
        userDisplayLabel({
          name: 'Jane',
          email: 'j@school.edu',
        }),
      ).toBe('Jane')
    })

    it('falls back to email when name missing or blank', () => {
      expect(userDisplayLabel({ email: 'a@b.edu' })).toBe('a@b.edu')
      expect(userDisplayLabel({ name: '   ', email: 'x@y.edu' })).toBe('x@y.edu')
    })
  })
})
