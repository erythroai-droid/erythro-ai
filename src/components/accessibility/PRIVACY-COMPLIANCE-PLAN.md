# Privacy Compliance Plan — Israel PPL 5741-1981 / Amendment 13
> Template for erythro-ai and future projects.

---

## Phase 1 — Technical (code) ✅ Done on erythro-ai

| Item | Implementation |
|---|---|
| Privacy policy page (en/ru/he) | Static content in `legalPages.ts` or CMS |
| Cite PPL 5741-1981 + Amendment 13 + Regs 5777-2017 | In policy intro |
| Data controller: name, location, email, phone | Section 1 of policy |
| Purposes + legal bases | Section 3 |
| Named subprocessors (Vercel, Hostinger, Supabase, n8n, Google) | Section 5 |
| Basic security level + retention (24 months) | Section 6 |
| Rights + how to submit request (arts. 13–14) | Section 7 |
| Cookies: essential vs analytics | Section 4 |
| Children under 18 | Section 8 |
| Contact form Art. 11 notice + opt-in checkbox | `ContactPrivacyConsent.tsx` on modal + `/contacts` |
| API rejects submissions without consent | `/api/contact` requires `privacyConsent: true` |
| **GA / analytics only after Accept** | `AnalyticsLoader.tsx` — conditional on `cookie_consent=accepted` |
| Clear analytics cookies on Decline | `clearAnalyticsCookies()` in `privacyConsent.ts` |
| Cookie consent banner (accept / decline) | `CookieConsent.tsx` |
| Revoke consent via footer | `openConsentSettings()` → footer button |
| GA Consent Mode v2 — ad signals denied | `AnalyticsLoader.tsx` — `ad_storage: denied`, `ad_personalization: denied` |
| Accessibility statement (IS 5568) | `/accessibility` page |

---

## Phase 2 — Policy text gaps to fill per project

### 2.1 Data retention
Add explicit retention periods per data category:
- Contact form submissions → e.g. "deleted within 24 months"
- Analytics (GA) → Google's own retention (14–26 months, configurable in GA4)
- Session/locale cookies → expiry in policy text

### 2.2 Legal entity / operator details
Add formal entity details to Section 1:
- Legal registered name (if different from brand name)
- Business registration number (if applicable)
- Privacy officer name or role (if required by scale)

### 2.3 Processor list
Maintain a named processor table in Section 5:

| Processor | Purpose | Country | Safeguard |
|---|---|---|---|
| Google LLC | Analytics (GA4) | USA | SCCs / adequacy |
| Vercel Inc. | Hosting, CDN | USA | SCCs |
| Neon / Supabase / PG provider | Database | US / EU | SCCs |
| Gmail / email provider | Contact replies | Various | Terms |

### 2.4 Rights exercise procedure
Add to Section 7:
- Response time commitment (e.g. "within 30 days")
- How to submit a request (email, form)
- What proof of identity is needed

---

## Phase 3 — Organisational (outside code)

These cannot be solved with code alone:

- [ ] Designate a privacy contact person (not just a generic email)
- [ ] Document internal procedure: how contact form submissions are reviewed, how long kept, who can access
- [ ] Set a calendar reminder to review and delete old contact submissions (e.g. every 6 months)
- [ ] Decide if business scale requires formal database registration with PPA
- [ ] Brief team on how to respond to privacy requests
- [ ] Set a policy review date (e.g. every 12 months or after major feature change)

---

## Phase 4 — Checklist for new projects

Before launch:

- [ ] Privacy policy page exists with all PPL-required sections
- [ ] Analytics / pixels blocked until consent
- [ ] Cookie banner names the analytics tool explicitly
- [ ] Decline actually prevents tracking (verify in DevTools)
- [ ] User can reopen consent settings after initial choice
- [ ] Analytics cookies cleared on Decline
- [ ] Consent Mode v2 configured (ad signals denied)
- [ ] `/privacy` link in footer and cookie banner
- [ ] Accessibility statement at `/accessibility` (IS 5568)
- [ ] Contact details for privacy requests visible

---

## Useful references

- [Israeli Privacy Protection Authority (PPA)](https://www.gov.il/en/departments/the_privacy_protection_authority)
- [PPL 5741-1981 text](https://www.nevo.co.il/law_html/law01/p202_001.htm)
- [Amendment 13 summary](https://www.gov.il/en/departments/news/amendment-13-privacy-protection-law)
- [Google Consent Mode v2 docs](https://developers.google.com/tag-platform/security/guides/consent)
- [IS 5568 / WCAG 2.0 AA](https://www.brn.co.il/wp-content/uploads/2024/12/f126aede-511e-41e4-8ad0-b278f33e6c43.pdf)
