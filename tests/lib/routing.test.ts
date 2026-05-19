import { describe, expect, it } from 'vitest'
import { getRouteForRole, parseOfferingIdParam } from '@/lib/routing'
import type { Role } from '@/services/types'

describe('routing', () => {
  describe('getRouteForRole', () => {
    it('sends admins to /admin', () => {
      expect(getRouteForRole('ADMIN')).toBe('/admin')
    })

    it('sends all other roles to /courses', () => {
      const nonAdmin: Role[] = [
        'INSTRUCTOR',
        'TA',
        'STUDENT',
        'VIEWER',
      ]
      for (const role of nonAdmin) {
        expect(getRouteForRole(role)).toBe('/courses')
      }
    })
  })

  describe('parseOfferingIdParam', () => {
    it('parses positive integers', () => {
      expect(parseOfferingIdParam('42')).toBe(42)
      expect(parseOfferingIdParam('0')).toBe(0)
    })

    it('returns undefined for missing or invalid', () => {
      expect(parseOfferingIdParam(undefined)).toBeUndefined()
      expect(parseOfferingIdParam('')).toBeUndefined()
      expect(parseOfferingIdParam('x')).toBeUndefined()
      expect(parseOfferingIdParam('12.5')).toBe(12)
    })
  })
})
