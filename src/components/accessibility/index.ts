/**
 * Reusable accessibility panel.
 *
 * Drop-in, framework-agnostic (React only — no Tailwind/design-system
 * dependency). Styles ship with the component and are themeable via
 * `--a11y-*` CSS variables.
 *
 * @example
 * ```tsx
 * import { AccessibilityPanel } from '@/components/accessibility'
 *
 * const [open, setOpen] = useState(false)
 *
 * <AccessibilityPanel
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   // optional: localize
 *   labels={{ title: 'Доступность', reset: 'Сбросить' }}
 *   // optional: label page landmarks for screen-reader mode
 *   screenReaderTargets={[{ id: 'services', label: 'Services section' }]}
 *   // optional: RTL, persistence key, footer credit
 *   rtl={false}
 *   storageKey="my-app-a11y"
 * />
 * ```
 *
 * Theming: override variables on `:root` (or any ancestor), e.g.
 * ```css
 * :root { --a11y-accent: #2563eb; --a11y-panel-bg: #111827; }
 * ```
 *
 * Deferred site-level WCAG work (focus trap, burger inert, GSAP/motion,
 * captions) lives in `./DEFERRED-P3.md` — revisit later; do not ship casually.
 */
export { default as AccessibilityPanel } from './AccessibilityPanel'
export type { AccessibilityPanelProps } from './AccessibilityPanel'
export {
  defaultAccessibilityLabels,
  type AccessibilityLabels,
  type ScreenReaderTarget,
} from './labels'
