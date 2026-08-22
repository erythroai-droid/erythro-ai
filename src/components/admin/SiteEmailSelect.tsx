'use client'

import React, { useMemo } from 'react'
import { FieldLabel, SelectInput, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

type EmailRow = {
  label?: string | null
  address?: string | null
}

/**
 * Payload stores array rows as flattened paths (`emails.0.address`), not as
 * `fields.emails.value`. Rebuild the address book from row metadata + paths.
 */
function emailsFromFormState(
  fields: Record<string, { value?: unknown; rows?: unknown } | undefined>,
): EmailRow[] {
  const list: EmailRow[] = []
  const rows = fields?.emails?.rows
  const count = Array.isArray(rows) ? rows.length : 0

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const address = fields[`emails.${i}.address`]?.value
      const label = fields[`emails.${i}.label`]?.value
      if (typeof address === 'string' && address.trim()) {
        list.push({
          address: address.trim(),
          label: typeof label === 'string' ? label : '',
        })
      }
    }
    return list
  }

  for (const key of Object.keys(fields || {})) {
    const match = /^emails\.(\d+)\.address$/.exec(key)
    if (!match) continue
    const address = fields[key]?.value
    if (typeof address !== 'string' || !address.trim()) continue
    const label = fields[`emails.${match[1]}.label`]?.value
    list.push({
      address: address.trim(),
      label: typeof label === 'string' ? label : '',
    })
  }
  return list
}

/**
 * Admin select whose options come from Site Settings → Contacts → Emails.
 * Stores the chosen address string.
 */
export const SiteEmailSelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })

  // Primitive return keeps use-context-selector from thrashing on new array refs.
  const emailsJson = useFormFields(([fields]) =>
    JSON.stringify(emailsFromFormState(fields as Record<string, { value?: unknown; rows?: unknown }>)),
  )
  const emails = useMemo(() => JSON.parse(emailsJson) as EmailRow[], [emailsJson])

  const options = useMemo(() => {
    const seen = new Set<string>()
    const list: { label: string; value: string }[] = []
    for (const row of emails) {
      const address = String(row.address || '').trim()
      if (!address) continue
      const key = address.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      const label = String(row.label || '').trim()
      list.push({
        value: address,
        label: label ? `${label} — ${address}` : address,
      })
    }
    if (value?.trim() && !seen.has(value.trim().toLowerCase())) {
      list.unshift({ value: value.trim(), label: `${value.trim()} (not in list)` })
    }
    return list
  }, [emails, value])

  const label =
    typeof field.label === 'string'
      ? field.label
      : field.label && typeof field.label === 'object' && 'en' in field.label
        ? String((field.label as { en?: string }).en || path)
        : path

  return (
    <div className={`field-type select${showError ? ' error' : ''}`}>
      <FieldLabel label={label} path={path} required={Boolean(field.required)} />
      <SelectInput
        path={path}
        name={path}
        options={options}
        value={value || ''}
        onChange={(incoming) => {
          if (typeof incoming === 'string') {
            setValue(incoming)
            return
          }
          if (Array.isArray(incoming)) {
            const first = incoming[0]
            setValue(typeof first === 'string' ? first : first?.value || '')
            return
          }
          setValue(
            incoming && typeof incoming === 'object' && 'value' in incoming
              ? String(incoming.value || '')
              : '',
          )
        }}
        isClearable
        placeholder={options.length ? 'Select email…' : 'Add emails above first'}
      />
      {showError && errorMessage ? (
        <div className="field-error" style={{ color: 'var(--theme-error-500)', marginTop: 4 }}>
          {errorMessage}
        </div>
      ) : null}
      {!options.length || (options.length === 1 && options[0]?.label?.includes('(not in list)')) ? (
        <div className="field-description" style={{ marginTop: 6 }}>
          Add at least one address in Emails to enable this dropdown.
        </div>
      ) : null}
    </div>
  )
}
