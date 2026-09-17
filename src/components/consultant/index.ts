/**
 * Reusable AI consultant widget.
 *
 * Self-contained React + CSS module: no Tailwind, no Payload, no
 * `SiteContentProvider`, no `liquid-gooey`, no `ChatButton`. Styling is themed
 * through `--consult-*` variables and everything host-specific (chips,
 * escalation, copy) is a prop — same contract as `@/components/accessibility`.
 *
 * @example
 * ```tsx
 * import { ConsultantWidget } from '@/components/consultant'
 *
 * const [open, setOpen] = useState(false)
 *
 * <ConsultantWidget
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   locale="ru"
 *   rtl={false}
 *   labels={{ title: 'Ассистент Erythro' }}
 *   chips={[
 *     { id: 'faq', label: 'Пакеты и цены', action: { kind: 'ask', text: 'Какие есть пакеты?' } },
 *     { id: 'order', label: 'Заказать сайт', action: { kind: 'escalate', target: 'order' } },
 *   ]}
 *   footerActions={[
 *     { id: 'wa', label: 'WhatsApp', action: { kind: 'escalate', target: 'whatsapp' } },
 *   ]}
 *   onEscalate={({ target }) => (target === 'form' ? openContactModal() : router.push('/audit'))}
 *   turnstileSiteKey={siteKey}
 * />
 * ```
 *
 * Theming: override the variables on any ancestor, e.g.
 * ```css
 * :root { --consult-accent: #2563eb; --consult-surface: #0f172a; }
 * ```
 *
 * Reserved for later (contract already in place, flags default to `false`):
 * `features.voice` adds mic / TTS controls to the composer slot,
 * `features.files` adds attachments as `file` parts, and `features.humanJoin`
 * renders `role: 'engineer'` bubbles in the same thread.
 */
export { default as ConsultantWidget } from './ConsultantWidget'
export type {
  ConsultantChip,
  ConsultantFeatures,
  ConsultantWidgetProps,
} from './ConsultantWidget'
export { defaultConsultantLabels, type ConsultantLabels } from './labels'
export { useConsultTurnstile } from './turnstile'
