'use client'

import React, { useMemo } from 'react'
import { FieldLabel, SelectInput, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

type EmailRow = {
  label?: string | null
  address?: string | null
}

/**
 * Admin select whose options come from Site Settings → Contacts → Emails.
 * Stores the chosen address string.
 */
export const SiteEmailSelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError, errorMessage } = useField<string>({ path })
  const emailsValue = useFormFields(([fields]) => fields?.emails?.value)

  const emails = useMemo(() => {
    if (!Array.isArray(emailsValue)) return [] as EmailRow[]
    return (emailsValue as EmailRow[]).filter((row) =>
      Boolean(row?.address && String(row.address).trim()),
    )
  }, [emailsValue])

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
      {!options.length ? (
        <div className="field-description" style={{ marginTop: 6 }}>
          Add at least one address in Emails to enable this dropdown.
        </div>
      ) : null}
    </div>
  )
}
