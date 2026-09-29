# Grow — оплата аудита

Платный заказ на `/order/audit-*` уходит на hosted-страницу Grow (Meshulam Light API). Карта на сайт не попадает. Код PayPlus в репозитории остаётся только для старого callback.

Живых списаний нет, пока пустые `GROW_USER_ID` и `GROW_PAGE_CODE`. Без них `POST /api/payment/create` отвечает `503` и заявку не создаёт. Номер счёта из письма Grow — это не `userId`. `userId` и `pageCode` выдаёт Grow после проверки интеграции.

Разрешение morning на приложение и платёжные ссылки не включает торговлю на `https://erythro.ai`. Отдельное разрешение на сайт Grow смотрит до 7 рабочих дней. Боевые идентификаторы — только для утверждённого адреса.

## Поток

1. Форма на `/order/audit-*` (кроме `audit-free`) вызывает `POST /api/payment/create`.
2. Сумма считается на сервере. Имя — два слова. Телефон — израильский мобильный `05XXXXXXXX`. Иначе `400`, заявка не создаётся.
3. Заявка создаётся со статусом `pending`, провайдер `grow`.
4. Сервер шлёт `POST /api/light/server/1.0/createPaymentProcess` как `multipart/form-data` (`chargeType: 1`, `paymentNum: 1`, `saveCardToken: 0`, ILS). Клиент уходит на `data.url`.
5. В заявке хранится `processId|processToken`. Это секрет процесса, не номер транзакции.
6. Grow вызывает `POST /api/payment/webhook` (`notifyUrl`). Тело — form-data, часто под ключом `data[...]`. Подписи нет.
7. Webhook не верит телу. Он находит заявку по сохранённому процессу, читает `getTransactionInfo` и сверяет `statusCode` `2`, сумму в шекелях и `cField1` с id заявки.
8. Затем сервер вызывает `approveTransaction`. Это закрытие цикла у Grow, не доказательство оплаты. Если ack не прошёл, ответ `503`, чтобы Grow повторил вызов. Повтор не ставит аудит в очередь второй раз.
9. Переход в `paid` — условный `UPDATE`. После `paid`: письмо сотрудникам, письмо клиенту, `triggerAuditAgent`.
10. Браузер возвращается на `/order/success?id=&sig=` с дописанным `response=success`. Подпись — HMAC `PAYLOAD_SECRET`. Страница показывает `pending`, пока статус не станет `paid`. Редирект оплату не подтверждает.

Отмена ведёт на `/order/cancel?slug=`.

`statusCode`, отличный от `2` (в том числе отложенная сделка `11`), заявку не переводит в `paid` и не в `failed`.

## Переменные

| Переменная | Назначение |
|---|---|
| `GROW_USER_ID` | Идентификатор бизнеса. Не номер счёта |
| `GROW_PAGE_CODE` | Страница оплаты (карта, Bit и кошельки — тот код, который выдал Grow) |
| `GROW_API_KEY` | Только если Grow выдал ключ платформы. Обычному бизнесу не нужен |
| `GROW_TEST_MODE=true` | Без `GROW_API_URL` ходит в `https://sandbox.meshulam.co.il` |
| `GROW_API_URL` | Явный base URL, если нужен не дефолт |

Прод: те же ключи на Vercel, `GROW_TEST_MODE` не ставить, base URL `https://secure.meshulam.co.il`, `NEXT_PUBLIC_SITE_URL=https://erythro.ai`. Success, cancel и notify должны быть публичным HTTPS. `localhost` Grow не принимает.

## Кабинет

- Документация: [Introduction](https://developers.grow.business/reference/introduction), [процесс](https://developers.grow.business/reference/the-process), [переход в прод](https://developers.grow.business/reference/live-environment).
- Запрос боевых `userId` / `pageCode`: `support@grow.business`, после того как sandbox-поток создаёт процесс, webhook отвечает и уходит `approveTransaction`.
- Возврат на старте — из кабинета Grow. Отдельный callback возврата в этот поток не зашит: аудит из-за возврата сам не останавливается.
- Счёт (חשבונית) в этот вызов не включаем.

## Что проверить до боевых ключей

1. Sandbox `userId` и `pageCode`, тестовая карта, сумма как на плане.
2. Заявка `paid` только после `getTransactionInfo`, страница success до этого пишет «подтверждаем».
3. Повтор того же notify не создаёт второй прогон аудита.
4. Отмена возвращает на `/order/<slug>` без `paid`.
5. Чужой POST на `/api/payment/webhook` без процесса этой заявки не ставит `paid`.
6. Имя из одного слова и не-израильский номер остаются на форме с текстом ошибки.
7. На форме заказа отмечен чекбокс со ссылками на `/privacy` и `/terms`.

## Что Grow смотрит на сайте

Список с [перехода в прод](https://developers.grow.business/reference/live-environment). Проверяют `https://erythro.ai`, не preview.

| Требование | Где на сайте |
|---|---|
| Живой сайт и услуги с ценой | Главная, `/order/audit-*` |
| Страница покупателя до карты | Кнопка заказа открывает форму: имя, email, телефон, сайт |
| Телефон | Подвал и шапка |
| Адрес | Подвал («Эйлат») и абзац условий |
| Галочка со ссылкой на условия | Форма заказа, не отмечена заранее. Ссылки на `/terms` и `/privacy` |
| Условия на главной: доставка, ответственность, 18+, отмена, конфиденциальность | Абзац `#purchase-terms` в подвале каждой страницы, включая главную. Текст — глобал Footer, поле Purchase terms notice. Полный текст — `/terms`, раздел 7, глобал Legal — Terms of Use |

Пока этот коммит не на проде, живой сайт этому списку не соответствует: галочка ведёт только на политику конфиденциальности, а на главной нет абзаца о покупке.

Код: `src/lib/payments/grow.ts`, `src/lib/payments/fulfillPayment.ts`, `src/components/PurchaseTermsNotice.tsx`, `src/app/api/payment/`.
