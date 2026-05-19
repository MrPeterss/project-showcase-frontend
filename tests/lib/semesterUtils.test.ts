import { describe, expect, it } from 'vitest'
import { formatSemesterShortName } from '@/lib/semesterUtils'

describe('semesterUtils', () => {
  describe('formatSemesterShortName', () => {
    it('formats season and year', () => {
      expect(
        formatSemesterShortName({
          id: 1,
          season: 'Fall',
          year: 2025,
          startDate: '',
          endDate: '',
        }),
      ).toBe('Fall 2025')
    })

    it('returns N/A for null/undefined', () => {
      expect(formatSemesterShortName(null)).toBe('N/A')
      expect(formatSemesterShortName(undefined)).toBe('N/A')
    })
  })
})
