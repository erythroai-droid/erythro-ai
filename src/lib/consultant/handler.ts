import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { jsonSchema, stepCountIs, streamText, tool, type ModelMessage } from 'ai'

import { forgetCachedSystemPrompt, getCachedSystemPrompt } from './cache'
import { consultModel, geminiApiKey } from './config'
import { buildSystemPrompt } from './prompt'
import { sanitizeBriefMarkdown, sanitizeText, stripUrls } from './sanitize'
import { createConsultStream, CONSULT_STREAM_HEADERS } from './stream'
import type {
  ConsultHandlerDeps,
  ConsultIdentity,
  ConsultLocale,
  ConsultMessage,
} from './types'

/**
 * Host-agnostic consultant brain. Everything that touches a database, SMTP,
 * a CRM or the Translater service arrives through `deps`, so a second project
 * can copy `lib/consultant` + `components/consultant` and only write its own
 * knowledge assembler.
 */

export type ConsultRespondInput = {
  locale: ConsultLocale
  messages: ConsultMessage[]
  identity: ConsultIdentity
  otpEnabled: boolean
}

const MAX_HISTORY = 24
const PHONE_RE = /^[+\d][\d\s\-()]{6,24}$/

function textOf(message: ConsultMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim()
}

function toModelMessages(messages: ConsultMessage[]): ModelMessage[] {
  return messages
    .slice(-MAX_HISTORY)
    .map((message) => ({
      // `engineer` replies are context for the model, not a separate API role.
      role: message.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: textOf(message),
    }))
    .filter((message) => message.content.length > 0)
}

/** Tool refusals are returned as data so the model can explain them in-language. */
function refuse(reason: string) {
  return { ok: false as const, reason }
}

export function createConsultHandler(deps: ConsultHandlerDeps) {
  const respond = async (input: ConsultRespondInput): Promise<Response> => {
    const { locale, messages, otpEnabled } = input
    const apiKey = geminiApiKey()
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'consultant_unconfigured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const [knowledge, rules] = await Promise.all([
      deps.getKnowledge(locale),
      deps.getRules(locale),
    ])

    // Mutable within one request: `identify_client` can unlock the brief tools
    // mid-conversation. The next request re-resolves it from the database.
    const identity: ConsultIdentity = { ...input.identity }
    const { body, emitter } = createConsultStream()

    const requireEmail = () =>
      otpEnabled && !identity.verifiedEmail
        ? refuse('Email is not verified yet. Ask the visitor to confirm their email in the widget.')
        : null

    const tools = {
      get_knowledge_base: tool({
        description:
          'Re-read the Erythro knowledge base (services, packages, prices, FAQ, cases). Call before quoting any number.',
        inputSchema: jsonSchema<{ topic?: string }>({
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'Optional keyword to narrow the excerpt, e.g. "audit" or "enterprise".',
            },
          },
          additionalProperties: false,
        }),
        execute: async ({ topic }) => {
          const fresh = await deps.getKnowledge(locale)
          if (!topic?.trim()) return { live: fresh.live, markdown: fresh.markdown }
          const needle = topic.trim().toLowerCase()
          const sections = fresh.markdown
            .split(/\n(?=## )/)
            .filter((section) => section.toLowerCase().includes(needle))
          return {
            live: fresh.live,
            markdown: sections.length ? sections.join('\n\n') : fresh.markdown,
          }
        },
      }),

      translate_terms: tool({
        description:
          'Resolve disputed IT terminology through the Erythro Translater. Use it instead of guessing an English or Hebrew equivalent.',
        inputSchema: jsonSchema<{ terms: string[] }>({
          type: 'object',
          properties: {
            terms: {
              type: 'array',
              items: { type: 'string' },
              description: 'Russian source terms or short phrases.',
            },
          },
          required: ['terms'],
          additionalProperties: false,
        }),
        execute: async ({ terms }) => {
          if (!deps.translate) return { translations: [], status: 'skipped' as const }
          const picked = terms.slice(0, 10).map((term) => sanitizeText(term, 200))
          const results = await Promise.all(
            picked.map(async (term) => {
              const out = await deps.translate!({ text: term, locale, style: 'UI/Microcopy' })
              return { term, translation: out.text, status: out.status }
            }),
          )
          return { translations: results }
        },
      }),

      hand_off: tool({
        description:
          'Show a widget chip that sends the visitor to an existing page or channel. Use for ready packages, the AI audit, the contact form or WhatsApp. Never write the URL yourself.',
        inputSchema: jsonSchema<{ target: 'form' | 'whatsapp' | 'audit' | 'order'; slug?: string }>({
          type: 'object',
          properties: {
            target: { type: 'string', enum: ['form', 'whatsapp', 'audit', 'order'] },
            slug: { type: 'string', description: 'Plan slug when target is "order".' },
          },
          required: ['target'],
          additionalProperties: false,
        }),
        execute: async ({ target, slug }) => {
          emitter.emit({
            type: 'action',
            action: { kind: 'escalate', target, ...(slug ? { slug: sanitizeText(slug, 80) } : {}) },
          })
          return { ok: true, shown: target }
        },
      }),

      identify_client: tool({
        description:
          'Store the phone number for a custom project. Only after the storage notice has been given. Required before drafting a brief.',
        inputSchema: jsonSchema<{ phone: string }>({
          type: 'object',
          properties: { phone: { type: 'string' } },
          required: ['phone'],
          additionalProperties: false,
        }),
        execute: async ({ phone }) => {
          const gate = requireEmail()
          if (gate) return gate
          const clean = sanitizeText(phone, 32)
          if (!PHONE_RE.test(clean)) {
            return refuse('That does not look like a phone number. Ask again.')
          }
          const { sessionId } = await deps.identifyClient({
            locale,
            email: identity.verifiedEmail!,
            phone: clean,
            messages,
          })
          identity.phone = clean
          identity.sessionId = sessionId
          emitter.emit({ type: 'action', action: { kind: 'identified', sessionId } })
          return { ok: true }
        },
      }),

      escalate_tech: tool({
        description:
          'File a non-standard technical question for a human specialist. The answer is delivered by email only — there is no thread in this widget.',
        inputSchema: jsonSchema<{ question: string }>({
          type: 'object',
          properties: { question: { type: 'string' } },
          required: ['question'],
          additionalProperties: false,
        }),
        execute: async ({ question }) => {
          const gate = requireEmail()
          if (gate) return gate
          const clean = stripUrls(sanitizeText(question, 4000))
          if (clean.length < 10) return refuse('Ask the visitor to describe the question first.')
          const excerpt = toModelMessages(messages)
            .slice(-6)
            .map((m) => `${m.role}: ${String(m.content)}`)
            .join('\n')
          const { ticketId } = await deps.escalateTech({
            locale,
            email: identity.verifiedEmail!,
            question: clean,
            excerpt: stripUrls(sanitizeText(excerpt, 6000)),
            sessionId: identity.sessionId,
          })
          emitter.emit({ type: 'action', action: { kind: 'ticket_created', ticketId } })
          return { ok: true, ticketId }
        },
      }),

      draft_brief: tool({
        description:
          'Show the visitor a draft brief in markdown for review. No links, no attachments, no invented stack or delivery dates.',
        inputSchema: jsonSchema<{ briefMarkdown: string }>({
          type: 'object',
          properties: { briefMarkdown: { type: 'string' } },
          required: ['briefMarkdown'],
          additionalProperties: false,
        }),
        execute: async ({ briefMarkdown }) => {
          const gate = requireEmail()
          if (gate) return gate
          if (!identity.phone) {
            return refuse('No phone number yet. Give the storage notice and call identify_client first.')
          }
          const clean = sanitizeBriefMarkdown(briefMarkdown)
          if (clean.length < 80) return refuse('The draft is too thin — keep interviewing.')
          emitter.emit({ type: 'action', action: { kind: 'brief_ready', markdown: clean } })
          return { ok: true, briefMarkdown: clean }
        },
      }),

      submit_brief: tool({
        description:
          'Send the approved brief to the Erythro team and open a CRM project card. Call only after the visitor confirmed the draft.',
        inputSchema: jsonSchema<{ briefMarkdown: string; name?: string; company?: string }>({
          type: 'object',
          properties: {
            briefMarkdown: { type: 'string' },
            name: { type: 'string' },
            company: { type: 'string' },
          },
          required: ['briefMarkdown'],
          additionalProperties: false,
        }),
        execute: async ({ briefMarkdown, name, company }) => {
          const gate = requireEmail()
          if (gate) return gate
          if (!identity.phone) {
            return refuse('No phone number yet. Call identify_client first.')
          }
          let clean = sanitizeBriefMarkdown(briefMarkdown)
          if (clean.length < 80) return refuse('The draft is too thin — keep interviewing.')

          // URLs are stripped before translation so the pipeline never sees them.
          let translaterStatus: 'translated' | 'skipped' = 'skipped'
          if (deps.translate && locale !== 'ru') {
            const translated = await deps.translate({
              text: clean,
              locale,
              style: 'Documentation/RFC',
            })
            if (translated.status === 'translated') {
              clean = sanitizeBriefMarkdown(translated.text)
              translaterStatus = 'translated'
            }
          }

          const result = await deps.submitBrief({
            locale,
            email: identity.verifiedEmail!,
            phone: identity.phone,
            ...(name ? { name: sanitizeText(name, 120) } : {}),
            ...(company ? { company: sanitizeText(company, 120) } : {}),
            briefMarkdown: clean,
            sessionId: identity.sessionId,
            translaterStatus,
          })
          emitter.emit({
            type: 'action',
            action: {
              kind: 'brief_sent',
              projectNumber: result.projectNumber,
              crmStatus: result.crmStatus,
            },
          })
          return { ok: true, projectNumber: result.projectNumber }
        },
      }),
    }

    const google = createGoogleGenerativeAI({ apiKey })
    const modelId = deps.model || consultModel()
    const system = buildSystemPrompt({ locale, knowledge, rules, identity, otpEnabled })

    // Streaming starts immediately; model work continues after the Response is
    // returned, so failures are reported inside the stream, not as a status code.
    void (async () => {
      const assistantChunks: string[] = []
      try {
        const cachedPrompt = await getCachedSystemPrompt({ apiKey, model: modelId, system })

        // The prefix cache is an optimisation, never a dependency: if Gemini
        // rejects the cache handle we drop it and replay with the inline prompt.
        // Only safe while nothing has been emitted yet.
        const attempts = cachedPrompt ? [cachedPrompt, null] : [null]

        for (const cacheName of attempts) {
          try {
            const result = streamText({
              model: google(modelId),
              // Gemini rejects a request carrying both a cache handle and its
              // own systemInstruction — send exactly one of them.
              ...(cacheName
                ? { providerOptions: { google: { cachedContent: cacheName } } }
                : { system }),
              messages: toModelMessages(messages),
              tools,
              stopWhen: stepCountIs(6),
              temperature: 0.3,
            })

            for await (const delta of result.textStream) {
              assistantChunks.push(delta)
              emitter.emit({ type: 'text-delta', delta })
            }
            break
          } catch (err) {
            if (cacheName === null || assistantChunks.length > 0) throw err
            console.error(
              '[consult] cached prompt rejected, retrying inline:',
              err instanceof Error ? err.message : String(err),
            )
            forgetCachedSystemPrompt(modelId, system)
          }
        }
      } catch (err) {
        console.error('[consult] stream failed:', err instanceof Error ? err.message : String(err))
        emitter.emit({ type: 'error', message: 'stream_failed' })
      } finally {
        const answer = assistantChunks.join('').trim()
        if (identity.sessionId && answer) {
          try {
            await deps.persistSession({
              sessionId: identity.sessionId,
              messages: [
                ...messages,
                { role: 'assistant', parts: [{ type: 'text', text: answer }] },
              ],
            })
          } catch (err) {
            console.error(
              '[consult] persist failed:',
              err instanceof Error ? err.message : String(err),
            )
          }
        }
        await emitter.close()
      }
    })()

    return new Response(body, { status: 200, headers: CONSULT_STREAM_HEADERS })
  }

  return { respond }
}
