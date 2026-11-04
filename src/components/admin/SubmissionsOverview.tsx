import React from 'react'
import type { ServerProps } from 'payload'
import { SUBMISSION_NAV_LINKS, type SubmissionNavId } from '@/lib/contactSubmissionSources'

/**
 * Dashboard card: submission counts per sidebar channel + quick links.
 * Leak calculator is source=audit + leadChannel=leak_calc (separate from AI Audit Orders).
 */
export const SubmissionsOverview: React.FC<ServerProps> = async ({ payload, user }) => {
  if (!user) return null

  const counts: Record<SubmissionNavId, number> = {
    contact: 0,
    order: 0,
    audit: 0,
    leak: 0,
  }

  try {
    const [order, contact, audit, leak] = await Promise.all([
      payload.count({
        collection: 'contact-submissions',
        where: { source: { equals: 'order' } },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: { source: { equals: 'contact' } },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [
            { source: { equals: 'audit' } },
            { leadChannel: { not_equals: 'leak_calc' } },
          ],
        },
        user,
        overrideAccess: false,
      }),
      payload.count({
        collection: 'contact-submissions',
        where: {
          and: [
            { source: { equals: 'audit' } },
            { leadChannel: { equals: 'leak_calc' } },
          ],
        },
        user,
        overrideAccess: false,
      }),
    ])
    counts.order = order?.totalDocs ?? 0
    counts.contact = contact?.totalDocs ?? 0
    counts.audit = audit?.totalDocs ?? 0
    counts.leak = leak?.totalDocs ?? 0
  } catch (err) {
    console.error('[SubmissionsOverview] count failed:', err)
    return null
  }

  const total = counts.contact + counts.order + counts.audit + counts.leak

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
          gridTemplateColumns: 'repeat(4, minmax(0, 118px))',
          gap: 8,
        }}
      >
        {SUBMISSION_NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
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
              {link.navLabel}
            </div>
            <div style={{ marginTop: 4, fontSize: 22, fontWeight: 700 }}>
              {counts[link.id]}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export default SubmissionsOverview
