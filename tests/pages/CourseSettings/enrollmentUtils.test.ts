import { describe, expect, it } from 'vitest'
import type { Enrollment, Team } from '@/services/types'
import {
  compareEnrollmentsByName,
  memberEmailsFromTeam,
  teamIdsContainingUser,
} from '@/pages/CourseSettings/enrollmentUtils'

function team(
  id: number,
  members: Array<{ userId: number; user?: { email?: string } }>,
): Team {
  return {
    id,
    name: `T${id}`,
    courseOfferingId: 1,
    createdAt: '',
    members: members.map((m) => ({
      userId: m.userId,
      teamId: id,
      user: m.user ? { email: m.user.email ?? '' } : undefined,
    })),
  }
}

function enrollment(
  userId: number,
  email: string,
  name?: string,
): Enrollment {
  return {
    userId,
    role: 'STUDENT',
    courseOfferingId: 1,
    user: {
      id: userId,
      email,
      role: 'STUDENT',
      createdAt: '',
      ...(name !== undefined ? { name } : {}),
    },
  }
}

describe('CourseSettings/enrollmentUtils', () => {
  describe('memberEmailsFromTeam', () => {
    it('collects unique member emails case-insensitively', () => {
      const t = team(1, [
        { userId: 1, user: { email: 'A@x.edu' } },
        { userId: 2, user: { email: 'a@x.edu' } },
        { userId: 3, user: { email: 'b@x.edu' } },
      ])
      expect(memberEmailsFromTeam(t)).toEqual(['A@x.edu', 'b@x.edu'])
    })

    it('skips members without email', () => {
      const t = team(2, [{ userId: 1 }, { userId: 2, user: { email: 'ok@x.edu' } }])
      expect(memberEmailsFromTeam(t)).toEqual(['ok@x.edu'])
    })
  })

  describe('teamIdsContainingUser', () => {
    it('returns team ids where user is a member', () => {
      const teams = [team(10, [{ userId: 5, user: { email: 'u@x.edu' } }]), team(20, [{ userId: 7 }])]
      const ids = teamIdsContainingUser(teams, 5)
      expect(ids.has(10)).toBe(true)
      expect(ids.has(20)).toBe(false)
    })
  })

  describe('compareEnrollmentsByName', () => {
    it('sorts by lowercased display name', () => {
      const a = enrollment(1, 'z@x.edu', 'Bob')
      const b = enrollment(2, 'a@x.edu', 'Amy')
      expect(compareEnrollmentsByName(a, b)).toBeGreaterThan(0)
      expect(compareEnrollmentsByName(b, a)).toBeLessThan(0)
    })

    it('uses email when names tie', () => {
      const a = enrollment(1, 'b@x.edu')
      const b = enrollment(2, 'a@x.edu')
      const c = compareEnrollmentsByName(a, b)
      expect(c).toBeGreaterThan(0)
    })

    it('breaks ties with userId', () => {
      const a = enrollment(2, 'same@x.edu', 'Same')
      const b = enrollment(1, 'same@x.edu', 'Same')
      expect(compareEnrollmentsByName(a, b)).toBeGreaterThan(0)
    })
  })
})
