/**
 * Text labels for the accessibility panel.
 *
 * The module ships with English defaults (see `defaultAccessibilityLabels`).
 * Consumers can override any subset via the `labels` prop — e.g. to localize
 * the panel or change wording — without touching the component.
 */
export interface AccessibilityLabels {
  /** Panel header title. */
  title: string
  /** Reset-all button text. */
  reset: string
  /** Small footer credit line (only rendered when `showPoweredBy` is true). */
  poweredBy: string
  /** Link to the full accessibility statement page. */
  statementLink: string
  /** Accessible label for the close (X) button. */
  closeLabel: string
  /** Announced in the live region when screen-reader mode is turned on. */
  screenReaderEnabled: string

  // Option tile labels
  biggerText: string
  dyslexia: string
  contrast: string
  monochrome: string
  highlightLinks: string
  pauseAnimations: string
  spacing: string
  cursor: string
  keyboardNavigation: string
  screenReader: string
}

/**
 * A DOM element the screen-reader option should annotate with an aria-label.
 * `id` is matched via `document.getElementById`.
 */
export interface ScreenReaderTarget {
  id: string
  label: string
}

export const defaultAccessibilityLabels: AccessibilityLabels = {
  title: 'Accessibility',
  reset: 'Reset Settings',
  poweredBy: '',
  statementLink: 'Accessibility Statement',
  closeLabel: 'Close accessibility panel',
  screenReaderEnabled: 'Screen reader mode enabled',
  biggerText: 'Bigger Text',
  dyslexia: 'Dyslexia Friendly',
  contrast: 'High Contrast',
  monochrome: 'Monochrome',
  highlightLinks: 'Highlight Links',
  pauseAnimations: 'Pause Animations',
  spacing: 'Text Spacing',
  cursor: 'Big Cursor',
  keyboardNavigation: 'Keyboard Navigation',
  screenReader: 'Screen Reader',
}
