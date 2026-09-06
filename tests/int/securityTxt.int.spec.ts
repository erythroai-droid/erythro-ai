import { describe, expect, it } from 'vitest'
import { GET, HEAD } from '@/app/.well-known/security.txt/route'

describe('RFC 9116 security.txt', () => {
  it('serves text/plain with required fields at /.well-known/security.txt', async () => {
    const res = GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')

    const body = await res.text()
    expect(body).toContain('Contact: mailto:order@erythro.ai')
    expect(body).toContain('Expires: 2027-01-01T00:00:00.000Z')
    expect(body).toContain('Preferred-Languages: en, ru')
    expect(body).toContain(
      'Canonical: https://erythro.ai/.well-known/security.txt',
    )
  })

  it('supports HEAD', () => {
    const res = HEAD()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/plain')
  })
})
