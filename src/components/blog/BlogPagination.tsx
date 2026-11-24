'use client'

import React from 'react'
import Link from 'next/link'
import { blogIndexHref, blogUi, tBlog } from '@/lib/blogPosts'

type Props = {
  locale: string
  theme: 'light' | 'dark'
  page: number
  totalPages: number
}

function pageList(current: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  if (current <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (current >= total - 2) {
    pages.add(total - 1)
    pages.add(total - 2)
    pages.add(total - 3)
  }
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: Array<number | '…'> = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…')
    out.push(sorted[i])
  }
  return out
}

export default function BlogPagination({ locale, theme, page, totalPages }: Props) {
  if (totalPages <= 1) return null

  const isLight = theme === 'light'
  const items = pageList(page, totalPages)
  const prev = page > 1 ? blogIndexHref(page - 1) : null
  const next = page < totalPages ? blogIndexHref(page + 1) : null

  const idle = isLight
    ? 'border-coal-900/20 text-coal-900 hover:border-erythro-500 hover:text-erythro-500'
    : 'border-white/25 text-white/85 hover:border-gold-500 hover:text-gold-500'
  const active = 'border-erythro-500 bg-erythro-500 text-white'
  const disabled = isLight
    ? 'border-coal-900/10 text-coal-900/35 pointer-events-none'
    : 'border-white/10 text-white/30 pointer-events-none'

  return (
    <nav
      className="mt-10 flex w-full flex-col items-center gap-4 lg:mt-14"
      aria-label={tBlog(blogUi.paginationLabel, locale)}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        {prev ? (
          <Link
            href={prev}
            className={`inline-flex min-h-10 items-center rounded-[2px] border px-3 font-sans text-sm transition-colors ${idle}`}
            rel="prev"
          >
            ← {tBlog(blogUi.prevPage, locale)}
          </Link>
        ) : (
          <span className={`inline-flex min-h-10 items-center rounded-[2px] border px-3 font-sans text-sm ${disabled}`}>
            ← {tBlog(blogUi.prevPage, locale)}
          </span>
        )}

        {items.map((item, idx) =>
          item === '…' ? (
            <span
              key={`e-${idx}`}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center font-sans text-sm ${
                isLight ? 'text-coal-900/40' : 'text-white/40'
              }`}
              aria-hidden
            >
              …
            </span>
          ) : (
            <Link
              key={item}
              href={blogIndexHref(item)}
              aria-current={item === page ? 'page' : undefined}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-[2px] border px-2 font-sans text-sm transition-colors ${
                item === page ? active : idle
              }`}
            >
              {item}
            </Link>
          ),
        )}

        {next ? (
          <Link
            href={next}
            className={`inline-flex min-h-10 items-center rounded-[2px] border px-3 font-sans text-sm transition-colors ${idle}`}
            rel="next"
          >
            {tBlog(blogUi.nextPage, locale)} →
          </Link>
        ) : (
          <span className={`inline-flex min-h-10 items-center rounded-[2px] border px-3 font-sans text-sm ${disabled}`}>
            {tBlog(blogUi.nextPage, locale)} →
          </span>
        )}
      </div>
    </nav>
  )
}
