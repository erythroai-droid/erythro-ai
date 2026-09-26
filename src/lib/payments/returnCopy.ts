import type { SiteLocale } from '@/lib/sitePrefs'

export type PaymentViewStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'unknown'

type Copy = Record<SiteLocale, string>

const copy = {
  paidTitle: {
    en: 'Payment confirmed',
    ru: 'Оплата подтверждена',
    he: 'התשלום אושר',
  },
  paidBody: {
    en: 'Thank you. Your payment is confirmed and your audit is being prepared. A confirmation email is on the way.',
    ru: 'Спасибо. Оплата подтверждена, аудит готовится. Письмо с подтверждением уже отправляется.',
    he: 'תודה. התשלום אושר והביקורת בהכנה. אימייל אישור בדרך.',
  },
  pendingTitle: {
    en: 'Confirming payment',
    ru: 'Подтверждаем оплату',
    he: 'מאשרים את התשלום',
  },
  pendingBody: {
    en: 'You are back from the payment page. We are waiting for PayPlus to confirm the charge. This usually takes under a minute.',
    ru: 'Вы вернулись со страницы оплаты. Ждём подтверждение списания от PayPlus. Обычно это занимает меньше минуты.',
    he: 'חזרתם מעמוד התשלום. ממתינים לאישור החיוב מ-PayPlus. בדרך כלל זה לוקח פחות מדקה.',
  },
  pendingSlow: {
    en: 'Confirmation is still pending. If you completed the payment, check your email in a few minutes or write to us with the order id.',
    ru: 'Подтверждение ещё не пришло. Если оплата прошла, проверьте почту через несколько минут или напишите нам с номером заказа.',
    he: 'האישור עדיין לא הגיע. אם השלמתם את התשלום, בדקו את האימייל בעוד כמה דקות או כתבו לנו עם מספר ההזמנה.',
  },
  failedTitle: {
    en: 'Payment not completed',
    ru: 'Оплата не завершена',
    he: 'התשלום לא הושלם',
  },
  failedBody: {
    en: 'The charge was not confirmed. You can try again. Nothing is prepared until PayPlus confirms the payment.',
    ru: 'Списание не подтверждено. Можно попробовать ещё раз. Аудит не запускается, пока PayPlus не подтвердит оплату.',
    he: 'החיוב לא אושר. אפשר לנסות שוב. הביקורת לא מתחילה עד ש-PayPlus מאשר את התשלום.',
  },
  refundedTitle: {
    en: 'Payment refunded',
    ru: 'Оплата возвращена',
    he: 'התשלום הוחזר',
  },
  refundedBody: {
    en: 'This payment was refunded. Write to us if you still need the audit.',
    ru: 'Этот платёж возвращён. Напишите нам, если аудит всё ещё нужен.',
    he: 'התשלום הזה הוחזר. כתבו לנו אם הביקורת עדיין נחוצה.',
  },
  unknownTitle: {
    en: 'Order not found',
    ru: 'Заказ не найден',
    he: 'ההזמנה לא נמצאה',
  },
  unknownBody: {
    en: 'This return link is invalid. Open the link from your email or start the order again.',
    ru: 'Эта ссылка возврата недействительна. Откройте ссылку из письма или начните заказ заново.',
    he: 'קישור החזרה הזה אינו תקף. פתחו את הקישור מהאימייל או התחילו את ההזמנה מחדש.',
  },
  orderId: { en: 'Order ID', ru: 'Номер заказа', he: 'מספר הזמנה' },
  viewStatus: { en: 'View order status', ru: 'Статус заказа', he: 'סטטוס ההזמנה' },
  tryAgain: { en: 'Try again', ru: 'Попробовать снова', he: 'נסו שוב' },
  home: { en: 'Back to home', ru: 'На главную', he: 'חזרה לדף הבית' },
  cancelTitle: { en: 'Payment cancelled', ru: 'Оплата отменена', he: 'התשלום בוטל' },
  cancelBody: {
    en: 'You left the payment page before the charge was completed. You can try again.',
    ru: 'Вы ушли со страницы оплаты до завершения списания. Можно попробовать снова.',
    he: 'עזבתם את עמוד התשלום לפני שהחיוב הושלם. אפשר לנסות שוב.',
  },
} satisfies Record<string, Copy>

export function paymentCopy(
  key: keyof typeof copy,
  locale: string,
): string {
  const row = copy[key]
  if (locale === 'ru' || locale === 'he') return row[locale]
  return row.en
}
