'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { submissionSourceDef } from '@/lib/contactSubmissionSources'

function asText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === '') return null
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(110px, 160px) minmax(0, 1fr)',
        gap: '6px 16px',
        padding: '8px 0',
        borderBottom: '1px solid var(--theme-elevation-100)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-600)',
          paddingTop: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

/**
 * Readable order / lead summary at the top of the submission edit view.
 */
export const SubmissionDetail: React.FC = () => {
  const { id, data } = useDocumentInfo()
  const name = useFormFields(([f]) => f?.name?.value)
  const email = useFormFields(([f]) => f?.email?.value)
  const phone = useFormFields(([f]) => f?.phone?.value)
  const message = useFormFields(([f]) => f?.message?.value)
  const source = useFormFields(([f]) => f?.source?.value as string | undefined)
  const locale = useFormFields(([f]) => f?.locale?.value)
  const website = useFormFields(([f]) => f?.website?.value)
  const auditLanguage = useFormFields(([f]) => f?.auditLanguage?.value)
  const planSlug = useFormFields(([f]) => f?.planSlug?.value)
  const planTotal = useFormFields(([f]) => f?.planTotal?.value)
  const auditStatus = useFormFields(([f]) => f?.auditStatus?.value)
  const auditScore = useFormFields(([f]) => f?.auditScore?.value)
  const reportUrl = useFormFields(([f]) => f?.reportUrl?.value)
  const ip = useFormFields(([f]) => f?.ip?.value)
  const errorLast = useFormFields(([f]) => f?.errorLast?.value)
  const retryCount = useFormFields(([f]) => f?.retryCount?.value)

  const channel = source ? submissionSourceDef(source as 'contact' | 'order' | 'audit') : undefined
  const title =
    channel?.id === 'order'
      ? 'Solution order'
      : channel?.id === 'audit'
        ? 'AI Audit order'
        : channel?.id === 'contact'
          ? 'Contact inquiry'
          : 'Submission'

  const createdRaw = data && typeof data === 'object' && 'createdAt' in data ? data.createdAt : null
  const createdLabel =
    typeof createdRaw === 'string' && !Number.isNaN(new Date(createdRaw).getTime())
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(createdRaw))
      : null

  const statusPage = id && source === 'audit' ? `/audit/report/${id}` : null
  const reportHref = typeof reportUrl === 'string' && reportUrl.trim() ? reportUrl.trim() : null
  const websiteHref = typeof website === 'string' && website.trim() ? website.trim() : null
  const emailHref = typeof email === 'string' && email.trim() ? `mailto:${email.trim()}` : null
  const phoneHref = typeof phone === 'string' && phone.trim() ? `tel:${phone.trim()}` : null

  return (
    <div
      style={{
        marginBottom: '1.75rem',
        padding: '16px 18px',
        borderRadius: 8,
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <div style={{ marginTop: 2, fontSize: 12, color: 'var(--theme-elevation-600)' }}>
            {channel?.navLabel || source || '—'}
            {id != null ? ` · #${id}` : null}
            {createdLabel ? ` · ${createdLabel}` : null}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {statusPage ? (
            <a
              className="btn btn--size-small btn--style-secondary"
              href={statusPage}
              target="_blank"
              rel="noreferrer"
            >
              Status page
            </a>
          ) : null}
          {reportHref ? (
            <a
              className="btn btn--size-small btn--style-secondary"
              href={reportHref}
              target="_blank"
              rel="noreferrer"
            >
              Open report
            </a>
          ) : null}
        </div>
      </div>

      <Row label="Name">{asText(name) || '—'}</Row>
      <Row label="Email">
        {emailHref ? (
          <a href={emailHref}>{asText(email)}</a>
        ) : (
          asText(email) || '—'
        )}
      </Row>
      <Row label="Phone">
        {phoneHref ? <a href={phoneHref}>{asText(phone)}</a> : asText(phone) || null}
      </Row>
      <Row label="Locale">{asText(locale) || null}</Row>
      <Row label="IP">{asText(ip) || null}</Row>
      <Row label="Plan">{asText(planSlug) || null}</Row>
      <Row label="Total">{asText(planTotal) || null}</Row>
      <Row label="Website">
        {websiteHref ? (
          <a href={websiteHref.includes('://') ? websiteHref : `https://${websiteHref}`} target="_blank" rel="noreferrer">
            {asText(website)}
          </a>
        ) : null}
      </Row>
      <Row label="Report lang">{asText(auditLanguage) || null}</Row>
      <Row label="Audit status">{asText(auditStatus) || null}</Row>
      <Row label="Score">{auditScore == null || auditScore === '' ? null : asText(auditScore)}</Row>
      <Row label="Retries">{retryCount == null || retryCount === '' ? null : asText(retryCount)}</Row>

      <Row label="Message">
        {asText(message) ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {asText(message)}
          </pre>
        ) : (
          '—'
        )}
      </Row>

      {asText(errorLast) ? (
        <Row label="Last error">
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'inherit',
              fontSize: 12,
              color: 'var(--theme-error-500)',
            }}
          >
            {asText(errorLast)}
          </pre>
        </Row>
      ) : null}
    </div>
  )
}

export default SubmissionDetail
