import { describe, expect, it } from 'vitest'
import { isValidEmail } from '@/lib/validation'

describe('validation', () => {
  describe('isValidEmail', () => {
    it('accepts typical academic emails', () => {
      expect(isValidEmail('a@b.edu')).toBe(true)
      expect(isValidEmail('user.name@cornell.edu')).toBe(true)
    })

    it('rejects invalid shapes', () => {
      expect(isValidEmail('not')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
      expect(isValidEmail('spaces in@mail.com')).toBe(false)
    })

    it('trims whitespace before validating', () => {
      expect(isValidEmail('  u@x.edu  ')).toBe(true)
    })
  })
})
