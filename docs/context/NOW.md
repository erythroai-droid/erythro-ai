# Latest changes

Обновлено: 2026-11-03 (leak_calc: отдельный раздел админки + письма)  
Статус: В работе (нужен деплой)

---

## 1. Leak Calculator ≠ AI Audit Orders
- **Проблема:** заявки с `leak-*` шли в тот же `source=audit` / `leadChannel=meta_ads`, смешивались с free AI Audit.
- **Фикс:**
  - `leadChannel=leak_calc` с хоста `leak-*` (`auditLeadChannelFromHost`);
  - сайдбар **Leak Calculator** + **AI Audit Orders** без leak;
  - staff email: `Erythro.ai leak calculator…`;
  - `proOfferStatus=skipped` для leak (нет платных тарифов / WhatsApp);
  - badge «Leak» в списке.
- **Следующий шаг:** commit → deploy. Старые leak-заявки в CMS останутся как `meta_ads` (не восстановить).

---

## 2. Ранее
- Mobile empty stats tiles, hosts `leak-*`, kicker AI Audit Online.
