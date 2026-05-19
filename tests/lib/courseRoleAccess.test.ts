import { describe, expect, it } from 'vitest'
import {
  canAccessAnyTeamDeployDashboard,
  canAccessCourseSettingsRoute,
  canAccessSparkOfferingRoute,
  isCourseOfferingAdmin,
  isCourseTa,
  isCourseTeachingStaff,
  formatAsTeachingRoleLeadingClause,
  phraseDeployAsBypassRole,
} from '@/lib/courseRoleAccess'

describe('courseRoleAccess', () => {
  it('isCourseOfferingAdmin matches ADMIN and INSTRUCTOR only', () => {
    expect(isCourseOfferingAdmin('ADMIN')).toBe(true)
    expect(isCourseOfferingAdmin('INSTRUCTOR')).toBe(true)
    expect(isCourseOfferingAdmin('TA')).toBe(false)
    expect(isCourseOfferingAdmin('STUDENT')).toBe(false)
    expect(isCourseOfferingAdmin(undefined)).toBe(false)
  })

  it('canAccessSparkOfferingRoute matches course offering admins', () => {
    expect(canAccessSparkOfferingRoute('ADMIN')).toBe(true)
    expect(canAccessSparkOfferingRoute('INSTRUCTOR')).toBe(true)
    expect(canAccessSparkOfferingRoute('TA')).toBe(false)
    expect(canAccessSparkOfferingRoute('STUDENT')).toBe(false)
  })

  it('isCourseTeachingStaff includes TAs', () => {
    expect(isCourseTeachingStaff('TA')).toBe(true)
    expect(isCourseTeachingStaff('STUDENT')).toBe(false)
    expect(isCourseTeachingStaff('ADMIN')).toBe(true)
  })

  it('canAccessCourseSettingsRoute is admin or instructor only', () => {
    expect(canAccessCourseSettingsRoute('INSTRUCTOR')).toBe(true)
    expect(canAccessCourseSettingsRoute('TA')).toBe(false)
    expect(canAccessCourseSettingsRoute('VIEWER')).toBe(false)
  })

  it('canAccessAnyTeamDeployDashboard includes TAs', () => {
    expect(canAccessAnyTeamDeployDashboard('TA')).toBe(true)
    expect(canAccessAnyTeamDeployDashboard('STUDENT')).toBe(false)
    expect(canAccessAnyTeamDeployDashboard('INSTRUCTOR')).toBe(true)
  })

  it('isCourseTa', () => {
    expect(isCourseTa('TA')).toBe(true)
    expect(isCourseTa('INSTRUCTOR')).toBe(false)
  })

  describe('formatAsTeachingRoleLeadingClause', () => {
    it('returns role-specific phrases', () => {
      expect(formatAsTeachingRoleLeadingClause('ADMIN')).toBe(
        'As a site administrator',
      )
      expect(formatAsTeachingRoleLeadingClause('INSTRUCTOR')).toBe(
        'As an instructor',
      )
      expect(formatAsTeachingRoleLeadingClause('TA')).toBe(
        'As a teaching assistant',
      )
    })

    it('returns generic phrase for unknown role', () => {
      expect(formatAsTeachingRoleLeadingClause(undefined)).toBe(
        'As teaching staff',
      )
      expect(formatAsTeachingRoleLeadingClause('STUDENT')).toBe(
        'As teaching staff',
      )
    })
  })

  describe('phraseDeployAsBypassRole', () => {
    it('returns noun phrases per role', () => {
      expect(phraseDeployAsBypassRole('ADMIN')).toBe('a site administrator')
      expect(phraseDeployAsBypassRole('INSTRUCTOR')).toBe('an instructor')
      expect(phraseDeployAsBypassRole('TA')).toBe('a teaching assistant')
    })

    it('returns generic for unknown', () => {
      expect(phraseDeployAsBypassRole(undefined)).toBe('teaching staff')
    })
  })
})
