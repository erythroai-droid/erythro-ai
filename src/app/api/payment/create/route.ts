import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getOrderPlanBySlug } from '@/lib/cmsPages'
import { calcPlanAmount, calcAddonAmount, addonMonthlyAmount, addonTermDiscount, tLocale, parsePrice } from '@/lib/orderPlans'
import { normalizeAuditWebsite } from '@/lib/auditFormValidation'
import { createGrowPayment, isGrowConfigured, toGrowFullName, toGrowIsraeliMobile } from '@/lib/payments/grow'
import { createMakeGrowPayment, isMakeGrowConfigured } from '@/lib/payments/makeGrow'
import { signPaymentReturn } from '@/lib/payments/returnSig'
import { getRequestIp, consumeContactRateLimit } from '@/lib/contactRateLimit'
import { isContactHoneypotTriggered } from '@/lib/contactHoneypot'
import {
  readTurnstileToken,
  turnstileActionFromBody,
  verifyTurnstileToken,
} from '@/lib/turnstile'

export const runtime = 'nodejs'
export const maxDuration = 30

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://erythro.ai'

/**
 * POST /api/payment/create
 *
 * Creates a contact-submission with paymentStatus=pending
 * and returns a Grow hosted-page URL.
 * When MAKE_GROW_WEBHOOK_URL is set, the URL comes from Make.
 * Otherwise the direct Grow API is used.
 * Paid checkout does not fall through to an unpaid contact submission.
 */
export async function POST(request: NextRequest) {
  const ip = getRequestIp(request)

  // Rate limit
  const limited = consumeContactRateLimit(`payment:${ip}`)
  if (!limited.ok) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(limited.retryAfterSec),
          'X-RateLimit-Limit': String(limited.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot check
  if (isContactHoneypotTriggered(body)) {
    console.warn('[api/payment/create] honeypot drop')
    return NextResponse.json({ ok: true })
  }

  // Turnstile verification
  const turnstile = await verifyTurnstileToken({
    token: readTurnstileToken(body),
    action: turnstileActionFromBody(body),
    remoteip: ip === 'unknown' ? undefined : ip,
  })
  if (!turnstile.ok) {
    return NextResponse.json({ message: turnstile.message }, { status: turnstile.status })
  }

  // Extract and validate required fields
  const planSlug = String(body.planSlug || '').trim()
  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const phone = String(body.phone || '').trim()
  const website = body.website ? normalizeAuditWebsite(String(body.website)) : ''
  const rawLang = String(body.auditLanguage || '').trim()
  const auditLanguage: ('en' | 'ru' | 'he') | undefined =
    rawLang === 'ru' || rawLang === 'he' || rawLang === 'en' ? rawLang : undefined
  const locale = String(body.locale || 'en').trim()
  const message = String(body.message || '').trim()
  const periodId = String(body.periodId || '').trim()
  const addonIds = Array.isArray(body.addonIds)
    ? (body.addonIds as string[]).map(String)
    : []

  if (!planSlug || !name || !email) {
    return NextResponse.json(
      { message: 'Missing required fields: planSlug, name, email' },
      { status: 400 },
    )
  }

  // Resolve plan server-side
  const plan = await getOrderPlanBySlug(planSlug)
  if (!plan) {
    return NextResponse.json({ message: 'Plan not found' }, { status: 404 })
  }

  // Calculate amount server-side (trust nothing from client)
  const pricing = calcPlanAmount(plan, periodId)
  let addonTotal = 0
  for (const addonId of addonIds) {
    const addon = plan.addons.find((a) => a.id === addonId)
    if (addon) {
      const monthlyPrice = addonMonthlyAmount(addon)
      const months = 1 // audit plans typically have no multi-month terms
      const discount = addonTermDiscount(addon, months)
      const { final } = calcAddonAmount(monthlyPrice, months, discount)
      addonTotal += final
    }
  }
  const totalAmount = pricing.base + addonTotal // in whole currency units (shekels)
  const totalMinor = Math.round(totalAmount * 100) // convert to agorot

  if (totalAmount <= 0) {
    return NextResponse.json({ code: 'not_payable' }, { status: 409 })
  }

  if (!toGrowFullName(name)) {
    return NextResponse.json({ code: 'name_unsupported' }, { status: 400 })
  }
  if (!toGrowIsraeliMobile(phone)) {
    return NextResponse.json({ code: 'phone_unsupported' }, { status: 400 })
  }

  const useMake = isMakeGrowConfigured()
  if (!SITE_URL.startsWith('https://') || (!useMake && !isGrowConfigured())) {
    console.error('[api/payment/create] payment gateway or public HTTPS site URL is not set')
    return NextResponse.json({ code: 'payment_unavailable' }, { status: 503 })
  }

  try {
    const payload = await getPayload({ config })

    // Create contact-submission with pending payment status
    const planTitle = tLocale(plan.card.title, locale)
    const created = await payload.create({
      collection: 'contact-submissions',
      data: {
        name,
        email,
        phone,
        message: message || `Order: ${planTitle} — ₪${totalAmount}`,
        locale,
        source: 'audit',
        ip,
        ...(website ? { website } : {}),
        ...(auditLanguage ? { auditLanguage } : {}),
        planSlug,
        planTotal: `₪${totalAmount}`,
        auditStatus: 'new',
        paymentStatus: 'pending',
        paymentProvider: 'grow',
        paymentAmount: totalAmount,
      },
    })

    const submissionId = String(created.id)

    const sig = signPaymentReturn(submissionId)
    const paymentInput = {
      amount: totalMinor,
      currency: 'ILS' as const,
      description: `Erythro AI audit ${planSlug}`,
      locale: (locale === 'ru' || locale === 'he' || locale === 'en' ? locale : 'en') as
        | 'en'
        | 'ru'
        | 'he',
      customer: { name: toGrowFullName(name) || name, email, phone: toGrowIsraeliMobile(phone) || phone },
      successUrl: `${SITE_URL}/order/success?id=${submissionId}&sig=${encodeURIComponent(sig)}`,
      cancelUrl: `${SITE_URL}/order/cancel?slug=${encodeURIComponent(planSlug)}`,
      webhookUrl: `${SITE_URL}/api/payment/webhook`,
      metadata: {
        submissionId,
        planSlug,
      },
    }
    const result = useMake
      ? await createMakeGrowPayment(paymentInput)
      : await createGrowPayment(paymentInput)

    if (!result.ok) {
      console.error('[api/payment/create] payment error:', result.message)
      await payload.update({
        collection: 'contact-submissions',
        id: created.id,
        data: { paymentStatus: 'failed' },
      }).catch(() => {})
      return NextResponse.json({ code: 'payment_unavailable' }, { status: 503 })
    }

    const saved = await payload
      .update({
        collection: 'contact-submissions',
        id: created.id,
        data: { paymentTransactionId: result.transactionUid },
      })
      .then(() => true)
      .catch((err) => {
        console.error('[api/payment/create] failed to save process ref:', err)
        return false
      })
    if (!saved) {
      await payload
        .update({
          collection: 'contact-submissions',
          id: created.id,
          data: { paymentStatus: 'failed' },
        })
        .catch(() => {})
      return NextResponse.json({ code: 'payment_unavailable' }, { status: 503 })
    }

    return NextResponse.json({
      ok: true,
      paymentUrl: result.paymentUrl,
      submissionId,
    })
  } catch (err) {
    console.error('[api/payment/create] Server error:', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
