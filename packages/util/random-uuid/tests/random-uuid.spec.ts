import { describe, expect, it, vi } from 'vitest'
import { randomUuid } from '@deepseek-ai/dsh-random-uuid'

describe('randomUuid', () => {
  it('uses getRandomValues and stamps RFC 4122 version and variant bits', () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.set(Array.from({ length: 16 }, (_, index) => index))
      return bytes
    })
    vi.stubGlobal('crypto', { getRandomValues })
    try {
      expect(randomUuid()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
      expect(getRandomValues).toHaveBeenCalledOnce()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('does not require the secure-context randomUUID method', () => {
    vi.stubGlobal('crypto', {
      getRandomValues(bytes: Uint8Array) {
        return bytes.fill(0xff)
      },
    })
    try {
      expect(randomUuid()).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
