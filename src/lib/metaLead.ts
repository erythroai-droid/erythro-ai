/**
 * Meta `Lead` content_name shared by the browser Pixel and server CAPI,
 * so both sides of a deduplicated event carry the same value.
 */
export function metaLeadContentName(input: {
  source?: string | null
  planSlug?: string | null
  leadChannel?: string | null
}): string {
  if (input.source === 'audit') {
    if (!input.planSlug || input.planSlug === 'audit-free') {
      return input.leadChannel === 'leak_calc' ? 'leak_calc' : 'free_audit'
    }
    return input.planSlug
  }
  return input.source || 'contact'
}
