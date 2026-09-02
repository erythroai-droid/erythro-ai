import { describe, expect, it } from 'vitest'
import { checkWebsiteReachable, isPrivateOrReservedIp } from '@/lib/checkWebsite'

describe('isPrivateOrReservedIp', () => {
  it('flags loopback, RFC1918, link-local, and CGNAT', () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('10.0.0.8')).toBe(true)
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true)
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true)
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true)
    expect(isPrivateOrReservedIp('100.64.1.1')).toBe(true)
    expect(isPrivateOrReservedIp('::1')).toBe(true)
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true)
  })

  it('allows public unicast', () => {
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false)
    expect(isPrivateOrReservedIp('93.184.216.34')).toBe(false)
    expect(isPrivateOrReservedIp('2a00:1450:4001:80b::200e')).toBe(false)
  })
})

describe('checkWebsiteReachable', () => {
  it('rejects bad format and blocked hosts without DNS', async () => {
    expect(await checkWebsiteReachable('not a url')).toEqual({ ok: false, reason: 'format' })
    expect(await checkWebsiteReachable('http://localhost')).toEqual({ ok: false, reason: 'format' })
    expect(await checkWebsiteReachable('http://internal.localhost', async () => [{ address: '8.8.8.8' }])).toEqual({
      ok: false,
      reason: 'blocked',
    })
  })

  it('accepts a public A record', async () => {
    const result = await checkWebsiteReachable('example.com', async () => [{ address: '93.184.216.34' }])
    expect(result).toEqual({ ok: true, hostname: 'example.com' })
  })

  it('rejects NXDOMAIN and private-only answers', async () => {
    expect(
      await checkWebsiteReachable('missing.example', async () => {
        throw new Error('ENOTFOUND')
      }),
    ).toEqual({ ok: false, reason: 'dns' })

    expect(
      await checkWebsiteReachable('intranet.example.com', async () => [{ address: '10.1.2.3' }]),
    ).toEqual({ ok: false, reason: 'dns' })
  })

  it('accepts mixed records when at least one address is public', async () => {
    const result = await checkWebsiteReachable('example.com', async () => [
      { address: '10.0.0.1' },
      { address: '1.1.1.1' },
    ])
    expect(result).toEqual({ ok: true, hostname: 'example.com' })
  })
})
