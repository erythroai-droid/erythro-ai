'use client'

import { useCallback, useRef, useState } from 'react'
import {
  isAuditEmailFormat,
  isAuditWebsiteFormat,
  type AuditField,
  type AuditFieldError,
  type AuditFieldErrors,
  type AuditFormValues,
} from '@/lib/auditFormValidation'
import { toE164Phone } from '@/lib/phoneE164'

export type AuditFieldOk = Partial<Record<AuditField, boolean>>

type CheckWebsiteResponse = { ok?: boolean; reason?: string }

async function postWebsiteCheck(website: string): Promise<CheckWebsiteResponse> {
  const res = await fetch('/api/audit/check-website', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website }),
  })
  const payload = (await res.json().catch(() => null)) as CheckWebsiteResponse | null
  if (res.status === 429) return { ok: false, reason: 'rate_limited' }
  return payload || { ok: false, reason: 'dns' }
}

/**
 * Green checks after blur; website also hits DNS via /api/audit/check-website.
 */
export function useAuditFieldChecks(
  values: AuditFormValues,
  setFieldErrors: React.Dispatch<React.SetStateAction<AuditFieldErrors>>,
) {
  const [ok, setOk] = useState<AuditFieldOk>({})
  const [checkingWebsite, setCheckingWebsite] = useState(false)
  const websiteGen = useRef(0)
  const verifiedWebsite = useRef('')

  const setFieldError = useCallback(
    (field: AuditField, err?: AuditFieldError) => {
      setFieldErrors((prev) => {
        if (!err) {
          if (!prev[field]) return prev
          const next = { ...prev }
          delete next[field]
          return next
        }
        if (prev[field] === err) return prev
        return { ...prev, [field]: err }
      })
    },
    [setFieldErrors],
  )

  const onValueChange = useCallback(
    (field: AuditField) => {
      if (field === 'website') {
        websiteGen.current += 1
        verifiedWebsite.current = ''
        setCheckingWebsite(false)
      }
      setOk((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
      setFieldError(field, undefined)
    },
    [setFieldError],
  )

  const blurName = useCallback(() => {
    const valid = values.name.trim().length > 0
    setOk((prev) => ({ ...prev, name: valid }))
    setFieldError('name', valid ? undefined : 'required')
  }, [setFieldError, values.name])

  const blurEmail = useCallback(() => {
    const raw = values.email.trim()
    if (!raw) {
      setOk((prev) => ({ ...prev, email: false }))
      setFieldError('email', 'required')
      return
    }
    const valid = isAuditEmailFormat(raw)
    setOk((prev) => ({ ...prev, email: valid }))
    setFieldError('email', valid ? undefined : 'invalid')
  }, [setFieldError, values.email])

  const blurPhone = useCallback(() => {
    const raw = values.phone.trim()
    if (!raw) {
      setOk((prev) => ({ ...prev, phone: false }))
      setFieldError('phone', 'required')
      return
    }
    const valid = Boolean(toE164Phone(raw))
    setOk((prev) => ({ ...prev, phone: valid }))
    setFieldError('phone', valid ? undefined : 'invalid')
  }, [setFieldError, values.phone])

  const checkWebsite = useCallback(
    async (raw: string): Promise<boolean> => {
      const trimmed = raw.trim()
      if (!trimmed) {
        setOk((prev) => ({ ...prev, website: false }))
        setFieldError('website', 'required')
        verifiedWebsite.current = ''
        return false
      }
      if (!isAuditWebsiteFormat(trimmed)) {
        setOk((prev) => ({ ...prev, website: false }))
        setFieldError('website', 'invalid')
        verifiedWebsite.current = ''
        return false
      }
      if (verifiedWebsite.current === trimmed) {
        setOk((prev) => ({ ...prev, website: true }))
        setFieldError('website', undefined)
        return true
      }

      const gen = ++websiteGen.current
      setCheckingWebsite(true)
      try {
        const payload = await postWebsiteCheck(trimmed)
        if (gen !== websiteGen.current) return false
        if (payload.ok) {
          verifiedWebsite.current = trimmed
          setOk((prev) => ({ ...prev, website: true }))
          setFieldError('website', undefined)
          return true
        }
        verifiedWebsite.current = ''
        setOk((prev) => ({ ...prev, website: false }))
        if (payload.reason === 'rate_limited') return true
        setFieldError('website', payload.reason === 'format' ? 'invalid' : 'unreachable')
        return false
      } catch {
        if (gen !== websiteGen.current) return false
        verifiedWebsite.current = ''
        setOk((prev) => ({ ...prev, website: false }))
        setFieldError('website', 'unreachable')
        return false
      } finally {
        if (gen === websiteGen.current) setCheckingWebsite(false)
      }
    },
    [setFieldError],
  )

  const blurWebsite = useCallback(() => {
    void checkWebsite(values.website)
  }, [checkWebsite, values.website])

  const ensureWebsiteOk = useCallback(() => checkWebsite(values.website), [checkWebsite, values.website])

  const resetChecks = useCallback(() => {
    websiteGen.current += 1
    verifiedWebsite.current = ''
    setOk({})
    setCheckingWebsite(false)
  }, [])

  return {
    ok,
    checkingWebsite,
    onValueChange,
    blurName,
    blurEmail,
    blurPhone,
    blurWebsite,
    ensureWebsiteOk,
    resetChecks,
  }
}
