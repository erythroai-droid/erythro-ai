'use client'

import React, { useCallback, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

type Row = {
  id?: unknown
  source?: unknown
  website?: unknown
  auditStatus?: unknown
  reportUrl?: unknown
  retryCount?: unknown
  errorLast?: unknown
}

async function requeueAudit(id: string | number, resetRetries = true) {
  const res = await fetch('/api/audit/admin/requeue', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, resetRetries }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    message?: string
    reason?: string
  }
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || data.reason || `HTTP ${res.status}`)
  }
  return data
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 'auto',
  paddingInline: 10,
  fontSize: 13,
}

/**
 * Edit-view controls for AI Audit submissions: open report, re-queue worker.
 */
export const AuditActions: React.FC = () => {
  const { id } = useDocumentInfo()
  const source = useFormFields(([fields]) => fields?.source?.value as string | undefined)
  const website = useFormFields(([fields]) => fields?.website?.value as string | undefined)
  const auditStatus = useFormFields(([fields]) => fields?.auditStatus?.value as string | undefined)
  const reportUrl = useFormFields(([fields]) => fields?.reportUrl?.value as string | undefined)
  const retryCount = useFormFields(([fields]) => fields?.retryCount?.value as number | undefined)
  const errorLast = useFormFields(([fields]) => fields?.errorLast?.value as string | undefined)

  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onRequeue = useCallback(async () => {
    if (!id) return
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      await requeueAudit(id, true)
      setMessage('Re-queued. Status reset to New — refresh the page to see updates.')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [id])

  if (source !== 'audit') return null

  const statusPage = id ? `/audit/report/${id}` : null
  const canRequeue = Boolean(id && website?.trim())

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div
        style={{
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--theme-elevation-800)',
        }}
      >
        Audit controls
      </div>
      <div
        style={{
          marginBottom: 10,
          fontSize: 12,
          color: 'var(--theme-elevation-600)',
          lineHeight: 1.45,
        }}
      >
        Status: <strong>{auditStatus || '—'}</strong>
        {typeof retryCount === 'number' ? ` · retries ${retryCount}` : null}
        {website ? (
          <>
            {' · '}
            <a href={website} target="_blank" rel="noreferrer">
              {website}
            </a>
          </>
        ) : (
          ' · missing website URL'
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {statusPage ? (
          <a
            className="btn btn--size-small btn--style-secondary"
            href={statusPage}
            target="_blank"
            rel="noreferrer"
            style={btnStyle}
          >
            Open status page
          </a>
        ) : null}
        {typeof reportUrl === 'string' && reportUrl.trim() ? (
          <a
            className="btn btn--size-small btn--style-secondary"
            href={reportUrl}
            target="_blank"
            rel="noreferrer"
            style={btnStyle}
          >
            Open report URL
          </a>
        ) : null}
        <button
          type="button"
          className="btn btn--size-small btn--style-primary"
          style={btnStyle}
          disabled={!canRequeue || busy}
          onClick={() => void onRequeue()}
          title="Reset status to New, clear error, reset retries, and call the worker"
        >
          {busy ? 'Re-queuing…' : 'Re-queue audit'}
        </button>
      </div>

      {errorLast ? (
        <pre
          style={{
            marginTop: 10,
            marginBottom: 0,
            maxHeight: 120,
            overflow: 'auto',
            padding: 8,
            fontSize: 11,
            borderRadius: 4,
            background: 'color-mix(in srgb, var(--theme-error-500) 12%, transparent)',
            color: 'var(--theme-error-500)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {errorLast}
        </pre>
      ) : null}

      {message ? (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--theme-success-500)' }}>{message}</div>
      ) : null}
      {error ? (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--theme-error-500)' }}>{error}</div>
      ) : null}
    </div>
  )
}

/**
 * List-view quick actions for AI Audit rows.
 */
export const AuditActionsCell: React.FC<{ rowData?: Row }> = ({ rowData }) => {
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  if (rowData?.source !== 'audit') return <span>—</span>

  const id = rowData.id
  if (typeof id !== 'string' && typeof id !== 'number') return <span>—</span>

  const statusPage = `/audit/report/${id}`
  const reportUrl = typeof rowData.reportUrl === 'string' ? rowData.reportUrl.trim() : ''
  const website = typeof rowData.website === 'string' ? rowData.website.trim() : ''

  const onRequeue = async () => {
    setBusy(true)
    setHint(null)
    try {
      await requeueAudit(id, true)
      setHint('Queued')
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, alignItems: 'center', maxWidth: 132 }}>
      <a href={statusPage} target="_blank" rel="noreferrer" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        Status
      </a>
      {reportUrl ? (
        <a href={reportUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
          PDF
        </a>
      ) : null}
      <button
        type="button"
        className="btn btn--size-small btn--style-secondary"
        style={{ ...btnStyle, paddingInline: 6, fontSize: 11, minHeight: 24 }}
        disabled={!website || busy}
        onClick={() => void onRequeue()}
      >
        {busy ? '…' : '↻'}
      </button>
      {hint ? (
        <span style={{ fontSize: 10, color: 'var(--theme-elevation-600)', whiteSpace: 'nowrap' }}>{hint}</span>
      ) : null}
    </div>
  )
}

export default AuditActions
