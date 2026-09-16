import type { CrmProjectInput, CrmProjectResult } from './createCrmProject'

/**
 * monday.com adapter (GraphQL v2).
 *
 * The item name is the project number so staff can search `TZ-…` directly.
 * The brief body goes into an item *update* rather than a column, because
 * column ids differ per board and an update works on any board layout.
 */

const MONDAY_ENDPOINT = 'https://api.monday.com/v2'
const MONDAY_API_VERSION = '2024-10'

function token(): string {
  return process.env.MONDAY_API_TOKEN?.trim() || ''
}

function boardId(): string {
  return process.env.MONDAY_BOARD_ID?.trim() || ''
}

export function isMondayConfigured(): boolean {
  return Boolean(token() && boardId())
}

type MondayResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
  error_message?: string
}

async function mondayRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(MONDAY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token(),
      'API-Version': MONDAY_API_VERSION,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15_000),
  })

  const json = (await res.json().catch(() => ({}))) as MondayResponse<T>
  if (!res.ok || json.errors?.length || json.error_message || !json.data) {
    const detail =
      json.errors?.map((e) => e.message).filter(Boolean).join('; ') ||
      json.error_message ||
      `HTTP ${res.status}`
    throw new Error(detail.slice(0, 300))
  }
  return json.data
}

const CREATE_ITEM = `
  mutation CreateProject($boardId: ID!, $itemName: String!) {
    create_item(board_id: $boardId, item_name: $itemName) { id }
  }
`

const CREATE_UPDATE = `
  mutation AddBrief($itemId: ID!, $body: String!) {
    create_update(item_id: $itemId, body: $body) { id }
  }
`

export async function createMondayProject(
  input: CrmProjectInput,
): Promise<CrmProjectResult> {
  if (!isMondayConfigured()) {
    return { status: 'pending', reason: 'MONDAY_API_TOKEN / MONDAY_BOARD_ID not set' }
  }

  try {
    const created = await mondayRequest<{ create_item: { id: string } }>(CREATE_ITEM, {
      boardId: boardId(),
      itemName: `${input.projectNumber} — ${input.contact.company || input.contact.name || input.contact.email}`,
    })
    const itemId = created.create_item?.id
    if (!itemId) throw new Error('monday returned no item id')

    const contactLines = [
      `Project: ${input.projectNumber}`,
      `Name: ${input.contact.name || '—'}`,
      `Company: ${input.contact.company || '—'}`,
      `Email: ${input.contact.email}`,
      `Phone: ${input.contact.phone}`,
      `Locale: ${input.contact.locale}`,
    ].join('\n')

    // Best effort: the card already exists, so a failed update is not fatal.
    try {
      await mondayRequest<{ create_update: { id: string } }>(CREATE_UPDATE, {
        itemId,
        body: `${contactLines}\n\n${input.briefMarkdown}`.slice(0, 20_000),
      })
    } catch (err) {
      console.error(
        '[crm/monday] item created but update failed:',
        err instanceof Error ? err.message : String(err),
      )
    }

    return { status: 'created', itemId }
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    console.error('[crm/monday] create failed:', reason)
    return { status: 'pending', reason }
  }
}
