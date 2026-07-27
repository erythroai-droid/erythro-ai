import { describe, expect, it, vi } from 'vitest'
import {
  SNAP_SUSPEND_EVENT,
  suspendSectionAutoSnap,
} from '@/hooks/useSectionAutoSnap'

describe('suspendSectionAutoSnap', () => {
  it('dispatches suspend event with duration', () => {
    const handler = vi.fn()
    window.addEventListener(SNAP_SUSPEND_EVENT, handler)

    suspendSectionAutoSnap(2200)

    expect(handler).toHaveBeenCalledOnce()
    const event = handler.mock.calls[0][0] as CustomEvent<{ ms?: number }>
    expect(event.type).toBe(SNAP_SUSPEND_EVENT)
    expect(event.detail?.ms).toBe(2200)

    window.removeEventListener(SNAP_SUSPEND_EVENT, handler)
  })

  it('defaults duration when omitted', () => {
    const handler = vi.fn()
    window.addEventListener(SNAP_SUSPEND_EVENT, handler)

    suspendSectionAutoSnap()

    const event = handler.mock.calls[0][0] as CustomEvent<{ ms?: number }>
    expect(event.detail?.ms).toBe(1800)

    window.removeEventListener(SNAP_SUSPEND_EVENT, handler)
  })
})
