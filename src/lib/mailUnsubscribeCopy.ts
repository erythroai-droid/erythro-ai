/**
 * Client-safe copy for commercial mail opt-out (no Payload / next/cache).
 */

export function unsubscribeCopy(locale: string): {
  title: string
  body: string
  confirm: string
  doneTitle: string
  doneBody: string
  alreadyBody: string
  invalidTitle: string
  invalidBody: string
  home: string
  linkLabel: string
} {
  if (locale === 'ru') {
    return {
      title: 'Отписаться от рассылки',
      body: 'Подтвердите отказ от коммерческих писем Erythro.ai (предложения Pro и КП). Сервисные письма по оплаченным заказам могут приходить по-прежнему.',
      confirm: 'Отписаться',
      doneTitle: 'Вы отписаны',
      doneBody: 'На этот адрес больше не будут уходить коммерческие письма и КП с team@erythro.ai.',
      alreadyBody: 'Этот адрес уже был отписан ранее.',
      invalidTitle: 'Ссылка недействительна',
      invalidBody: 'Откройте ссылку «Отписаться от рассылки» из письма ещё раз или напишите на team@erythro.ai.',
      home: 'На главную',
      linkLabel: 'Отписаться от рассылки',
    }
  }
  if (locale === 'he') {
    return {
      title: 'ביטול הרשמה לדיוור',
      body: 'אשרו ביטול קבלת מיילים מסחריים מ-Erythro.ai (הצעות Pro ו-KP). מיילים תפעוליים על הזמנות ששולמו עשויים להמשיך.',
      confirm: 'בטלו הרשמה',
      doneTitle: 'בוטלה ההרשמה',
      doneBody: 'לכתובת זו לא יישלחו יותר מיילים מסחריים ו-KP מ-team@erythro.ai.',
      alreadyBody: 'הכתובת כבר בוטלה בעבר.',
      invalidTitle: 'הקישור אינו תקף',
      invalidBody: 'פתחו שוב את קישור «ביטול הרשמה לדיוור» מהמייל או כתבו ל-team@erythro.ai.',
      home: 'לדף הבית',
      linkLabel: 'ביטול הרשמה לדיוור',
    }
  }
  return {
    title: 'Unsubscribe from mailing',
    body: 'Confirm that you no longer want commercial emails from Erythro.ai (Pro offers and proposals). Transactional mail about paid orders may still be sent.',
    confirm: 'Unsubscribe',
    doneTitle: 'You are unsubscribed',
    doneBody: 'This address will no longer receive commercial emails or proposals from team@erythro.ai.',
    alreadyBody: 'This address was already unsubscribed.',
    invalidTitle: 'Invalid link',
    invalidBody: 'Open the “Unsubscribe” link from the email again, or write to team@erythro.ai.',
    home: 'Home',
    linkLabel: 'Unsubscribe from mailing',
  }
}
