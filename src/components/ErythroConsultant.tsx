'use client'

import { useEffect, useMemo, useState } from 'react'

import { ConsultantWidget, type ConsultantChip, type ConsultantLabels } from './consultant'
import { useContactModal } from './ContactModal'
import { useSiteContent } from './SiteContentProvider'
import { whatsAppHref as buildWhatsAppHref } from '@/lib/phoneE164'

/**
 * Erythro wiring for the reusable consultant module: chips, escalation targets
 * and CMS copy. Kept outside `components/consultant/` so the module itself
 * stays free of `SiteContentProvider`, the contact modal and Tailwind.
 */

type Locale = 'en' | 'ru' | 'he'

function pickLocale(locale: string): Locale {
  return locale === 'ru' || locale === 'he' ? locale : 'en'
}

const COPY: Record<Locale, Partial<ConsultantLabels>> = {
  en: {
    title: 'Erythro assistant',
    disclaimer: 'AI assistant. Answers come from the erythro.ai knowledge base.',
    openLabel: 'Open the AI consultant',
    closeLabel: 'Close',
    inputPlaceholder: 'Ask about packages, prices or your project',
    send: 'Send',
    thinking: 'Typing…',
    savePolicy:
      'If we prepare a project brief or escalate a technical question, this chat is stored for up to 12 months so the team can see the context.',
    chipFaq: 'Packages and prices',
    chipBrief: 'Build a brief',
    chipAudit: 'Take an audit',
    chipOrder: 'Order a site',
    footerWhatsApp: 'WhatsApp',
    footerContacts: 'Contacts',
    footerTelegram: 'Telegram',
  },
  ru: {
    title: 'Ассистент Erythro',
    disclaimer: 'ИИ-ассистент. Отвечает по базе знаний erythro.ai.',
    openLabel: 'Открыть ИИ-консультанта',
    closeLabel: 'Закрыть',
    inputPlaceholder: 'Спросите о пакетах, ценах или своём проекте',
    send: 'Отправить',
    thinking: 'Печатает…',
    greeting:
      'Здравствуйте, я ИИ-ассистент Erythro. Расскажу про пакеты, цены и ИИ-аудит или помогу собрать ТЗ на проект.',
    savePolicy:
      'Если составляем ТЗ или передаём технический вопрос специалисту, переписка сохраняется до 12 месяцев, чтобы команда видела контекст.',
    otpIntro: 'Чтобы продолжить, подтвердите email — пришлём код из шести цифр.',
    otpEmailSubmit: 'Отправить код',
    otpCodeIntro: 'Введите шесть цифр из письма.',
    otpCodeSubmit: 'Подтвердить',
    otpResend: 'Отправить код заново',
    otpInvalidEmail: 'Адрес выглядит некорректным.',
    otpInvalidCode: 'Неверный или просроченный код.',
    otpTooMany: 'Слишком много попыток. Попробуйте позже.',
    otpMailFailed: 'Не удалось отправить код. Напишите через контактную форму.',
    otpVerified: 'Email подтверждён.',
    dailyLimitReached:
      'На сегодня лимит сообщений исчерпан. Напишите на order@erythro.ai или в WhatsApp.',
    unavailable: 'Ассистент временно недоступен. Контактная форма работает.',
    streamFailed: 'Ответ прервался.',
    briefDraftTitle: 'Черновик ТЗ',
    briefDraftHint: 'Напишите в чат, что поправить, затем подтвердите отправку.',
    briefSentTitle: 'ТЗ отправлено',
    briefSentBody:
      'Проект {number} создан. Референсы загрузите в карточку проекта в CRM — не в этот чат.',
    briefCrmPending: 'Карточку в CRM создадим вручную, ТЗ у команды уже есть.',
    ticketCreated:
      'Вопрос ушёл специалисту. Ответ придёт на email — треда в этом чате нет.',
    chipFaq: 'Пакеты и цены',
    chipBrief: 'Составить ТЗ',
    chipAudit: 'Пройти аудит',
    chipOrder: 'Заказать сайт',
    footerWhatsApp: 'WhatsApp',
    footerContacts: 'Контакты',
    footerTelegram: 'Telegram',
  },
  he: {
    title: 'עוזר Erythro',
    disclaimer: 'עוזר AI. התשובות מבוססות על מסד הידע של erythro.ai.',
    openLabel: 'פתיחת יועץ ה-AI',
    closeLabel: 'סגירה',
    inputPlaceholder: 'שאלו על חבילות, מחירים או הפרויקט שלכם',
    send: 'שליחה',
    thinking: 'מקליד…',
    greeting:
      'שלום, אני עוזר ה-AI של Erythro. אסביר על החבילות, המחירים וביקורת ה-AI, או אעזור לבנות מסמך אפיון.',
    savePolicy:
      'אם נבנה מסמך אפיון או נעביר שאלה טכנית למומחה, השיחה תישמר עד 12 חודשים כדי שהצוות יראה את ההקשר.',
    otpIntro: 'כדי להמשיך, אשרו את האימייל — נשלח קוד בן שש ספרות.',
    otpEmailSubmit: 'שליחת קוד',
    otpCodeIntro: 'הזינו את שש הספרות מהמייל.',
    otpCodeSubmit: 'אישור',
    otpResend: 'שליחת קוד חדש',
    otpInvalidEmail: 'הכתובת אינה נראית תקינה.',
    otpInvalidCode: 'קוד שגוי או שפג תוקפו.',
    otpTooMany: 'יותר מדי נסיונות. נסו שוב מאוחר יותר.',
    otpMailFailed: 'לא הצלחנו לשלוח את הקוד. השתמשו בטופס יצירת הקשר.',
    otpVerified: 'האימייל אושר.',
    dailyLimitReached:
      'מגיעים למגבלת ההודעות להיום. כתבו ל-order@erythro.ai או ב-WhatsApp.',
    unavailable: 'העוזר אינו זמין כרגע. טופס יצירת הקשר פועל.',
    streamFailed: 'התשובה נקטעה.',
    briefDraftTitle: 'טיוטת אפיון',
    briefDraftHint: 'כתבו בצ׳אט מה לתקן ואז אשרו שליחה.',
    briefSentTitle: 'האפיון נשלח',
    briefSentBody:
      'הפרויקט {number} נוצר. העלו אסמכתאות לכרטיס הפרויקט ב-CRM — לא לצ׳אט הזה.',
    briefCrmPending: 'כרטיס ה-CRM ייווצר ידנית; האפיון כבר אצל הצוות.',
    ticketCreated: 'השאלה הועברה למומחה. התשובה תגיע במייל — אין כאן שרשור.',
    chipFaq: 'חבילות ומחירים',
    chipBrief: 'בניית אפיון',
    chipAudit: 'לעבור ביקורת',
    chipOrder: 'להזמין אתר',
    footerWhatsApp: 'WhatsApp',
    footerContacts: 'יצירת קשר',
    footerTelegram: 'Telegram',
  },
}

const ASK_PACKAGES: Record<Locale, string> = {
  en: 'Which packages do you offer and what do they cost?',
  ru: 'Какие есть пакеты и сколько они стоят?',
  he: 'אילו חבילות יש ומה המחירים?',
}

const ASK_BRIEF: Record<Locale, string> = {
  en: 'I need a custom project. Help me put together a brief.',
  ru: 'Нужен кастомный проект. Помогите составить ТЗ.',
  he: 'אני צריך פרויקט מותאם. עזרו לי לבנות אפיון.',
}

export type ConsultantCopy = {
  enabled: boolean
  greeting: string
  otpPrompt: string
  otpCodePrompt: string
  savePolicyNotice: string
  quotaExhaustedNotice: string
}

export default function ErythroConsultant({
  isOpen,
  onClose,
  locale = 'en',
  copy: copyFromHost,
}: {
  isOpen: boolean
  onClose: () => void
  locale?: string
  /** Prefetch from `ChatButton` so the launcher can hide before first open. */
  copy?: ConsultantCopy | null
}) {
  const key = pickLocale(locale)
  const site = useSiteContent().siteSettings
  const { open: openContactModal } = useContactModal()
  const [cmsCopy, setCmsCopy] = useState<ConsultantCopy | null>(copyFromHost ?? null)
  const [copyReady, setCopyReady] = useState(Boolean(copyFromHost))

  useEffect(() => {
    if (copyFromHost) return
    setCmsCopy(null)
    setCopyReady(false)
  }, [key, copyFromHost])

  useEffect(() => {
    if (!copyFromHost) return
    setCmsCopy(copyFromHost)
    setCopyReady(true)
  }, [copyFromHost])

  // Prefetch CMS copy on mount so the first open is not gated on the network.
  // Kill switch is owned by ChatButton (PIT-089) — do not unmount this tree.
  useEffect(() => {
    if (copyReady || cmsCopy) return
    let cancelled = false
    fetch(`/api/consult/copy?locale=${key}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ConsultantCopy | null) => {
        if (!cancelled && data) setCmsCopy(data)
      })
      .catch(() => {
        /* built-in copy is a fine fallback */
      })
      .finally(() => {
        if (!cancelled) setCopyReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [cmsCopy, copyReady, key])

  const labels = useMemo<Partial<ConsultantLabels>>(() => {
    const base = COPY[key]
    if (!cmsCopy) return base
    return {
      ...base,
      ...(cmsCopy.greeting ? { greeting: cmsCopy.greeting } : {}),
      ...(cmsCopy.savePolicyNotice ? { savePolicy: cmsCopy.savePolicyNotice } : {}),
      ...(cmsCopy.otpPrompt ? { otpIntro: cmsCopy.otpPrompt } : {}),
      ...(cmsCopy.otpCodePrompt ? { otpCodeIntro: cmsCopy.otpCodePrompt } : {}),
      ...(cmsCopy.quotaExhaustedNotice
        ? { dailyLimitReached: cmsCopy.quotaExhaustedNotice }
        : {}),
    }
  }, [cmsCopy, key])

  const whatsAppLink = buildWhatsAppHref(site.phone || '') || ''
  const telegramHref = (site.telegram || '').trim()

  const chips = useMemo<ConsultantChip[]>(() => {
    return [
      {
        id: 'order',
        label: COPY[key].chipOrder!,
        action: { kind: 'escalate', target: 'order' },
      },
      { id: 'audit', label: COPY[key].chipAudit!, action: { kind: 'escalate', target: 'audit' } },
      {
        id: 'faq',
        label: COPY[key].chipFaq!,
        action: { kind: 'ask', text: ASK_PACKAGES[key] },
      },
      {
        id: 'brief',
        label: COPY[key].chipBrief!,
        action: { kind: 'ask', text: ASK_BRIEF[key], gate: 'otp' },
      },
    ]
  }, [key])

  const footerActions = useMemo<ConsultantChip[]>(() => {
    const out: ConsultantChip[] = []
    if (whatsAppLink) {
      out.push({
        id: 'whatsapp',
        label: COPY[key].footerWhatsApp!,
        action: { kind: 'escalate', target: 'whatsapp' },
      })
    }
    out.push({
      id: 'contacts',
      label: COPY[key].footerContacts!,
      action: { kind: 'escalate', target: 'form' },
    })
    if (telegramHref) {
      out.push({
        id: 'telegram',
        label: COPY[key].footerTelegram!,
        action: { kind: 'escalate', target: 'telegram' },
      })
    }
    return out
  }, [key, telegramHref, whatsAppLink])

  if (cmsCopy && !cmsCopy.enabled) return null

  return (
    <ConsultantWidget
      isOpen={isOpen}
      onClose={onClose}
      locale={key}
      rtl={key === 'he'}
      labels={labels}
      chips={chips}
      footerActions={footerActions}
      turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      onEscalate={({ target, slug }) => {
        if (target === 'form') {
          onClose()
          openContactModal()
          return
        }
        if (target === 'whatsapp') {
          if (whatsAppLink) window.open(whatsAppLink, '_blank', 'noopener,noreferrer')
          return
        }
        if (target === 'telegram') {
          if (telegramHref) window.open(telegramHref, '_blank', 'noopener,noreferrer')
          return
        }
        // The chat never places an order: hand off to the existing pages.
        const href = target === 'audit' ? '/audit' : slug ? `/order/${slug}` : '/order'
        window.location.assign(href)
      }}
    />
  )
}
