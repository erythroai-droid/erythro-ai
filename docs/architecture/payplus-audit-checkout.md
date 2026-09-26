# PayPlus — оплата аудита

Код готов к ключам. Живых списаний нет, пока в окружении пустые `PAYPLUS_API_KEY`, `PAYPLUS_SECRET_KEY` и `PAYPLUS_PAYMENT_PAGE_UID`. Платный заказ без этих переменных отвечает `503` и не создаёт неоплаченную заявку.

Бесплатный аудит по-прежнему идёт через `/api/contact`. Лимиты Free (`AUDIT_INTAKE_LIMITS_OPEN_FOR_QA`) включать обратно только после того, как платный терминал реально принимает оплату.

## Поток

1. Форма на `/order/audit-*` (кроме `audit-free`) вызывает `POST /api/payment/create`.
2. Сумма считается на сервере. Заявка создаётся со статусом `pending`.
3. `PaymentPages/GenerateLink` (`charge_method: 1`, ILS, один платёж, ссылка живёт 60 минут). Клиент уходит на hosted-страницу PayPlus. Карта на сайт не попадает.
4. PayPlus вызывает `GET` или `POST /api/payment/webhook`.
5. Webhook не верит телу callback. Он читает `PaymentPages/ipn-full`, сверяет `more_info` (`submission:<id>`), сумму в шекелях, валюту ILS и код `000`.
6. Переход в `paid` — условный `UPDATE`. Повторный callback не шлёт письма второй раз и не ставит аудит в очередь ещё раз.
7. После `paid`: письмо сотрудникам, письмо клиенту, `triggerAuditAgent`.
8. Браузер возвращается на `/order/success?id=&sig=`. Подпись — HMAC `PAYLOAD_SECRET`. Страница показывает `pending`, пока статус не станет `paid`. Редирект сам по себе оплату не подтверждает.

Отмена и неуспех ведут на `/order/cancel?slug=`.

## Переменные

| Переменная | Назначение |
|---|---|
| `PAYPLUS_API_KEY` | Заголовок `api-key` |
| `PAYPLUS_SECRET_KEY` | Заголовок `secret-key` |
| `PAYPLUS_PAYMENT_PAGE_UID` | Страница оплаты из кабинета |
| `PAYPLUS_TEST_MODE=true` | Без `PAYPLUS_API_URL` ходит в `https://restapidev.payplus.co.il/api/v1.0` |
| `PAYPLUS_API_URL` | Явный base URL, если нужен не дефолт |
| `PAYPLUS_ISSUE_INVOICE=1` | Шлёт `initial_invoice: true`. Включать только когда модуль счетов уже включён на странице. Иначе поле не отправляется, действует настройка кабинета |
| `PAYPLUS_PRODUCT_UID` | Позиция каталога PayPlus. Пустое значение оставляет товар по умолчанию страницы. Имя товара текстом не передаём: PayPlus создаёт новый товар на каждое списание |

Прод: те же ключи на Vercel, `PAYPLUS_TEST_MODE` не ставить, `NEXT_PUBLIC_SITE_URL=https://erythro.ai`.

Язык страницы PayPlus: `he` для иврита сайта, иначе `en`. Отдельной русской страницы в API нет.

## Кабинет PayPlus

- Редирект success/failure: метод **GET**. Callback URL можно оставить пустым в кабинете: его передаёт API (`https://erythro.ai/api/payment/webhook`).
- Метод списания страницы: немедленное J4. Рассрочку на аудите не включаем (`payments_selected: 1`), иначе сумма в IPN может не совпасть с заказом и `paid` не встанет.
- Тестовые карты: [Sandbox Credit Card Numbers](https://docs.payplus.co.il/reference/sandbox-credit-card-numbers).
- Счёт (חשבונית): модуль в кабинете, затем `PAYPLUS_ISSUE_INVOICE=1`. Ссылка на документ, если пришла в IPN, дописывается в письмо сотрудникам.
- Возврат на старте — из кабинета PayPlus. Callback с типом Refund переводит заявку из `paid` в `refunded` и пишет сотрудникам. Аудит из-за возврата сам не останавливается.

## Что проверить до боевых ключей

1. Sandbox-ключ, тестовая карта, сумма как на плане.
2. Заявка `paid` только после callback, страница success до этого пишет «подтверждаем».
3. Повтор того же callback не создаёт второй прогон аудита.
4. Отмена возвращает на `/order/<slug>` без `paid`.
5. С неверным `id` без подписи success показывает «заказ не найден».
6. Иностранные карты и ставка — в договоре с эквайером, не в коде. Сейчас валюта только ILS.

Код: `src/lib/payments/payplus.ts`, `src/lib/payments/fulfillPayment.ts`, `src/app/api/payment/`.
