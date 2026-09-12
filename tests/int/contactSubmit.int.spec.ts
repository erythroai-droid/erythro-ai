import { describe, expect, it } from 'vitest'
import { contactSubmitErrorMessage } from '@/lib/contactSubmit'

const copy = {
  error: 'Something went wrong. Please try again.',
  rateLimited: 'Too many requests. Please wait a minute and try again.',
  captchaFailed: 'Verification failed. Please try again.',
}

describe('contactSubmitErrorMessage', () => {
  it('uses localized cooldown copy from the API', () => {
    expect(
      contactSubmitErrorMessage(429, { reason: 'domain_recent', message: 'Этот сайт уже анализировался недавно.' }, copy),
    ).toBe('Этот сайт уже анализировался недавно.')
    expect(
      contactSubmitErrorMessage(429, { reason: 'user_recent', message: 'Вы исчерпали лимит бесплатных аудитов.' }, copy),
    ).toBe('Вы исчерпали лимит бесплатных аудитов.')
  })

  it('does not show English IP-window 429 text', () => {
    expect(
      contactSubmitErrorMessage(429, { message: 'Too many requests. Please try again later.' }, copy),
    ).toBe(copy.rateLimited)
  })

  it('maps captcha and generic failures', () => {
    expect(contactSubmitErrorMessage(403, { message: 'Verification failed' }, copy)).toBe(copy.captchaFailed)
    expect(contactSubmitErrorMessage(400, { message: 'Missing required fields' }, copy)).toBe(copy.error)
    expect(contactSubmitErrorMessage(500, null, copy)).toBe(copy.error)
  })
})
