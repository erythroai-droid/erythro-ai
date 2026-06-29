import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const locale = typeof body.locale === 'string' ? body.locale : undefined

  if (!name || !email || !message) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Invalid email' }, { status: 400 })
  }
  if (message.length > 5000) {
    return NextResponse.json({ message: 'Message too long' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'contact-submissions',
      data: { name, email, phone, message, locale },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/contact] Failed to save submission:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
