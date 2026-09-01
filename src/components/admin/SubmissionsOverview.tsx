import React from 'react'
import type { ServerProps } from 'payload'
import {
  CONTACT_SUBMISSION_SOURCES,
  submissionListHref,
  type ContactSubmissionSourceId,
} from '@/lib/contactSubmissionSources'

/**
 * Dashboard card: submission counts per intake channel + quick links.
 */
export const SubmissionsOverview: React.FC<ServerProps> = async ({ payload, user }) => {
  if (!user) return null

  const counts: Record<ContactSubmissionSourceId, number> = {
    contact: 0,
    order: 0,
    audit: 0,
  }

  try {
    const results = await Promise.all(
      CONTACT_SUBMISSION_SOURCES.map((source) =>
        payload.count({
          collection: 'contact-submissions',
          where: { source: { equals: source.id } },
          user,
          overrideAccess: false,
        }),
      ),
    )
    CONTACT_SUBMISSION_SOURCES.forEach((source, i) => {
      counts[source.id] = results[i]?.totalDocs ?? 0
    })
  } catch (err) {
    console.error('[SubmissionsOverview] count failed:', err)
    return null
  }

  const total = counts.contact + counts.order + counts.audit

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
          <div style={{ fontSize: 15, fontWeight: 700 }}>Submissions</div>
          <div style={{ fontSize: 12, color: 'var(--theme-elevation-600)', marginTop: 2 }}>
            Contact Submissions by channel · {total} total
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 118px))',
          gap: 8,
        }}
      >
        {CONTACT_SUBMISSION_SOURCES.map((source) => (
          <a
            key={source.id}
            href={submissionListHref(source.id)}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: 6,
              background: 'var(--theme-elevation-0)',
              border: '1px solid var(--theme-elevation-100)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--theme-elevation-600)' }}>
              {source.navLabel}
            </div>
            <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>
              {counts[source.id]}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default SubmissionsOverview
