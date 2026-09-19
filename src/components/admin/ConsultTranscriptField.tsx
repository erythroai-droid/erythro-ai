'use client'

import React from 'react'
import { FieldLabel, useDocumentInfo, useField } from '@payloadcms/ui'
import type { JSONFieldClientComponent } from 'payload'

type TranscriptPart = {
  type?: string
  text?: string
  name?: string
  mediaType?: string
  durationMs?: number
}

type TranscriptMessage = {
  role?: string
  parts?: TranscriptPart[]
}

function unwrapJson(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return value
    try {
      return unwrapJson(JSON.parse(trimmed) as unknown)
    } catch {
      return value
    }
  }
  return value
}

function asMessages(value: unknown): TranscriptMessage[] | null {
  const parsed = unwrapJson(value)
  if (Array.isArray(parsed)) return parsed as TranscriptMessage[]
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { messages?: unknown }).messages)) {
    return (parsed as { messages: TranscriptMessage[] }).messages
  }
  return null
}

function partText(part: TranscriptPart): string {
  if (part.type === 'file') {
    return part.name ? `File: ${part.name}` : 'File attachment'
  }
  if (part.type === 'audio') {
    const seconds =
      typeof part.durationMs === 'number' ? `${Math.round(part.durationMs / 1000)}s` : ''
    return seconds ? `Audio (${seconds})` : 'Audio'
  }
  return typeof part.text === 'string' ? part.text : ''
}

function messageBody(message: TranscriptMessage): string {
  if (!Array.isArray(message.parts) || message.parts.length === 0) return ''
  return message.parts.map(partText).filter(Boolean).join('\n\n')
}

function roleLabel(role: string | undefined): string {
  if (role === 'user') return 'Visitor'
  if (role === 'engineer') return 'Engineer'
  if (role === 'assistant') return 'Assistant'
  return role?.trim() || 'Unknown'
}

function roleColor(role: string | undefined): string {
  if (role === 'user') return 'var(--theme-success-500)'
  if (role === 'engineer') return 'var(--theme-warning-500)'
  return 'var(--theme-elevation-600)'
}

function fromDoc(source: unknown, path: string): unknown {
  return source && typeof source === 'object'
    ? (source as Record<string, unknown>)[path]
    : undefined
}

function pickRaw(
  value: unknown,
  data: unknown,
  initialData: unknown,
  path: string,
): unknown {
  const candidates = [value, fromDoc(data, path), fromDoc(initialData, path)]
  for (const candidate of candidates) {
    if (asMessages(candidate)) return candidate
  }
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== '') return candidate
  }
  return undefined
}

/**
 * Payload's JSON field mounts Monaco from a CDN. Admin CSP blocks that host, so
 * the Messages editor spins forever. Render the transcript from form/document
 * state instead — no Monaco, readable as a chat.
 */
export const ConsultTranscriptField: JSONFieldClientComponent = ({ field, path }) => {
  const { value } = useField<unknown>({ path })
  const docInfo = useDocumentInfo() as {
    data?: unknown
    initialData?: unknown
    savedDocumentData?: unknown
  }
  const raw = pickRaw(value, docInfo.data ?? docInfo.savedDocumentData, docInfo.initialData, path)
  const messages = asMessages(raw)
  const description =
    field.admin && 'description' in field.admin && typeof field.admin.description === 'string'
      ? field.admin.description
      : undefined

  const label =
    typeof field.label === 'string'
      ? field.label
      : field.label && typeof field.label === 'object' && 'en' in field.label
        ? String((field.label as { en?: string }).en || 'Messages')
        : 'Messages'

  return (
    <div className="field-type json">
      <FieldLabel label={label} path={path} required={Boolean(field.required)} />
      {description ? <div className="field-description">{description}</div> : null}

      {messages == null ? (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            color: 'var(--theme-elevation-600)',
            fontSize: 13,
          }}
        >
          Transcript is empty or not a message array.
        </div>
      ) : messages.length === 0 ? (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            color: 'var(--theme-elevation-600)',
            fontSize: 13,
          }}
        >
          No messages stored yet.
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 640,
            overflow: 'auto',
            padding: 12,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 6,
            background: 'var(--theme-elevation-50)',
          }}
        >
          {messages.map((message, index) => {
            const body = messageBody(message)
            return (
              <div
                key={`${message.role || 'msg'}-${index}`}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  background: 'var(--theme-elevation-0)',
                  border: '1px solid var(--theme-elevation-100)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: roleColor(message.role),
                    marginBottom: 6,
                  }}
                >
                  {roleLabel(message.role)}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {body || '—'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export const ConsultTranscriptCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  const messages = asMessages(cellData)
  const count = messages?.length ?? 0
  return <span style={{ fontSize: 12 }}>{count === 1 ? '1 message' : `${count} messages`}</span>
}

export default ConsultTranscriptField
