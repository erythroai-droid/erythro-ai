/** Desktop-only band behind the navbar — hidden on mobile via CSS + Tailwind. */
export default function HeaderChipStrip() {
  return (
    <div
      aria-hidden
      data-header-chip-strip
      data-menu-contrast="dark"
      className="header-chip-strip-bg pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-[100px] lg:block"
    />
  )
}
