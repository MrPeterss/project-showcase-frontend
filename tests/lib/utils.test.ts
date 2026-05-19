import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils (cn)', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toMatch(/px-4/)
    const hide = false
    expect(cn('block', hide && 'hidden', 'flex')).toContain('flex')
  })

  it('handles conditional classes', () => {
    expect(cn('a', undefined, null, 'b')).toBeTruthy()
  })
})
