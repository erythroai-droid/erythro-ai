# Deferred accessibility work (§3)

Do **not** implement casually — these changes can break scroll/GSAP, menus, or hero media.

Revisit when ready for a dedicated a11y pass with desktop + mobile + `he` RTL testing.

## Focus trap + background inert (modals)

- **Where:** `ContactModal.tsx`, `AccessibilityPanel.tsx`
- **Risk:** Focus stuck; dialog won’t close; Tab escapes to page behind
- **WCAG:** 2.1.2, 2.4.3

## Closed burger menu out of tab order

- **Where:** `Navbar.tsx` overlay when `mobileOpen === false`
- **Approach:** `inert` / `hidden` / `tabIndex={-1}` on focusables — not only `pointer-events` + transform
- **Risk:** Breaks open animation, Tab, or overlay links
- **WCAG:** 2.1.1, 2.4.3

## Global `prefers-reduced-motion` → pause GSAP + video

- **Where:** site-wide (home pin timelines, hero/section videos)
- **Risk:** Empty/broken scroll-pin sections, “dead” home scroll
- **WCAG:** 2.2.2, 2.3.3 (related)

## Meaningful video: captions / controls

- **Where:** hero and other non-decorative video (not muted bg only)
- **Risk:** Breaks full-bleed autoplay hero and mobile UX
- **WCAG:** 1.2.2, 1.2.5, 2.2.2

## Default high-contrast / filter on entire `html`

- **Avoid** forcing brand-breaking filters site-wide; keep opt-in via a11y panel
- **Risk:** Brand colors, portfolio screenshots
- **WCAG:** 1.4.3 (related — prefer real contrast fixes over global filter)

## Keyboard-first rewrite of GSAP scroll sections

- **Where:** home Services / Solutions / Let’s Talk pin flows
- **Risk:** Highest visual + timing breakage
- **WCAG:** 2.1.1, 2.4.3

---

**Context:** §1 (CMS alts) = editor; §2 (safe code + statement) = shipped `7f72e97`.  
Statement already discloses these limitations at `/accessibility`.
