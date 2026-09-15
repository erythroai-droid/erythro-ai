/**
 * The brief and the `order@` email must stay link-free and attachment-free:
 * references are uploaded to the CRM card after the interview, never pasted
 * into the chat. These helpers are the last gate before persistence / SMTP.
 */

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>()[\]{}"'`]+/gi
const MAILTO_RE = /\bmailto:[^\s<>()[\]{}"'`]+/gi
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)]*)\)/g
const BARE_DOMAIN_RE =
  /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|ai|co|ru|il|dev|app|me|xyz|site|online|cloud|link|drive)\b(?:\/[^\s<>()[\]{}"'`]*)?/gi

const LINK_PLACEHOLDER = '[ссылка удалена]'

/** Control characters other than tab / newline — header injection and log noise. */
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/**
 * Removes every URL shape from markdown while keeping the human-readable link
 * text, so a brief reads naturally after stripping.
 */
export function stripUrls(input: string): string {
  return input
    .replace(MARKDOWN_IMAGE_RE, '$1')
    .replace(MARKDOWN_LINK_RE, '$1')
    .replace(URL_RE, LINK_PLACEHOLDER)
    .replace(MAILTO_RE, LINK_PLACEHOLDER)
    .replace(BARE_DOMAIN_RE, LINK_PLACEHOLDER)
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()
}

export function hasUrl(input: string): boolean {
  URL_RE.lastIndex = 0
  MAILTO_RE.lastIndex = 0
  return URL_RE.test(input) || MAILTO_RE.test(input)
}

/** Strips control chars and clamps length before anything reaches SMTP or the DB. */
export function sanitizeText(input: string, maxLength = 4000): string {
  return input.replace(CONTROL_RE, '').trim().slice(0, maxLength)
}

/** Single-line values used in mail headers (subject, display name). */
export function sanitizeHeaderValue(input: string, maxLength = 120): string {
  return input.replace(/[\r\n"<>]/g, '').trim().slice(0, maxLength)
}

export function sanitizeBriefMarkdown(input: string): string {
  return stripUrls(sanitizeText(input, 20_000))
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
