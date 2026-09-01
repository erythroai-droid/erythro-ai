import React from 'react'
import type { ServerProps } from 'payload'
import {
  AUDITS_ACTIVE_HREF,
  AUDITS_FAILED_HREF,
  AUDITS_LIST_HREF,
} from './auditAdminLinks'

type StatusKey = 'new' | 'in_progress' | 'failed' | 'report_sent'

const LABELS: Record<StatusKey, string> = {
  new: 'New',
  in_progress: 'In progress',
  failed: 'Failed',
  report_sent: 'Report sent',
}

/**
 * Dashboard card: AI Audit pipeline counts + quick links.
 * Server component — uses Payload Local API from admin ServerProps.
 */
export const AuditsDashboard: React.FC<ServerProps> = async ({ payload, user }) => {
  if (!user) return null

  let total = 0
  let counts: Record<StatusKey, number> = {
    new: 0,
    in_progress: 0,
    failed: 0,
    report_sent: 0,
  }

  try {
    const [t, n, p, f, s] = await Promise.all([
      payload.count({
        collection: 'contact-submissions',
        where: { source: { equals: 'audit' } },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [{ source: { equals: 'audit' } }, { auditStatus: { equals: 'new' } }],
        },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [{ source: { equals: 'audit' } }, { auditStatus: { equals: 'in_progress' } }],
        },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [{ source: { equals: 'audit' } }, { auditStatus: { equals: 'failed' } }],
        },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [{ source: { equals: 'audit' } }, { auditStatus: { equals: 'report_sent' } }],
        },
        user,
        overrideAccess: false,
      }),
    ])
    total = t.totalDocs
    counts = {
      new: n.totalDocs,
      in_progress: p.totalDocs,
      failed: f.totalDocs,
      report_sent: s.totalDocs,
    }
  } catch (err) {
    console.error('[AuditsDashboard] count failed:', err)
    return null
  }

  return (
    <div
      style={{
        marginBottom: '1.5rem',
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
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>AI Audits</div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)', marginTop: 2 }}>
            Pipeline on Contact Submissions · {total} total
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
          <a href={AUDITS_LIST_HREF}>All audits</a>
          <a href={AUDITS_FAILED_HREF}>Failed ({counts.failed})</a>
          <a href={AUDITS_ACTIVE_HREF}>Active ({counts.new + counts.in_progress})</a>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 10,
        }}
      >
        {(Object.keys(LABELS) as StatusKey[]).map((key) => (
          <div
            key={key}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-100)',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--theme-elevation-600)' }}>{LABELS[key]}</div>
            <div
              style={{
                marginTop: 4,
                fontSize: 22,
                fontWeight: 700,
                color:
                  key === 'failed' && counts.failed > 0
                    ? 'var(--theme-error-500)'
                    : 'var(--theme-elevation-800)',
              }}
            >
              {counts[key]}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AuditsDashboard
