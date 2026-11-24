'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blogPosts'
import { blogUi, formatBlogDate, tBlog } from '@/lib/blogPosts'

type Props = {
  locale: string
  theme: 'light' | 'dark'
  posts: BlogPost[]
}

export default function BlogIndexBody({ locale, theme, posts }: Props) {
  const isLight = theme === 'light'
  const title = tBlog(blogUi.indexTitle, locale)
  const kicker = tBlog(blogUi.indexKicker, locale)
  const description = tBlog(blogUi.indexDescription, locale)
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const bodyTone = isLight ? 'text-coal-900/80' : 'text-white/80'
  const cardClass = isLight
    ? 'border-coal-900/10 bg-white/80 hover:border-coal-900/25'
    : 'border-white/10 bg-white/[0.04] hover:border-white/25'

  return (
    <section
      id="blog"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col gap-10 px-[30px] py-12 md:gap-12 md:py-16 lg:py-20">
        <header className="flex w-full flex-col gap-4">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-erythro-500">
            {kicker}
          </p>
          <h1 className="m-0 font-sans text-[28px] font-extralight uppercase tracking-[0.08em] md:text-[40px] md:tracking-[0.1em]">
            <span className="text-erythro-500">{title.charAt(0)}</span>
            <span className={headingTone}>{title.slice(1)}</span>
          </h1>
          <p className={`m-0 max-w-3xl font-sans text-lg font-light leading-8 md:text-xl md:leading-9 ${bodyTone}`}>
            {description}
          </p>
        </header>

        {posts.length === 0 ? (
          <div className={`rounded-[10px] border px-6 py-10 ${cardClass}`}>
            <h2 className={`m-0 text-xl font-medium ${headingTone}`}>{tBlog(blogUi.emptyTitle, locale)}</h2>
            <p className={`mt-3 m-0 text-base leading-7 ${bodyTone}`}>{tBlog(blogUi.emptyBody, locale)}</p>
            <Link
              href="/audit"
              className="mt-6 inline-flex text-base font-medium text-erythro-500 underline-offset-4 hover:underline"
            >
              {tBlog(blogUi.emptyCta, locale)} →
            </Link>
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2">
            {posts.map((post) => {
              const postTitle = tBlog(post.title, locale)
              const excerpt = tBlog(post.excerpt, locale)
              const date = formatBlogDate(post.publishedAt, locale)
              return (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className={`group flex h-full flex-col overflow-hidden rounded-[10px] border transition-colors ${cardClass}`}
                  >
                    {post.cover?.src ? (
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-coal-900/10">
                        <Image
                          src={post.cover.src}
                          alt={post.cover.alt || postTitle}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 100vw, 560px"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                      {date ? (
                        <time dateTime={post.publishedAt || undefined} className={`text-sm ${bodyTone}`}>
                          {date}
                        </time>
                      ) : null}
                      <h2 className={`m-0 text-xl font-medium leading-snug ${headingTone}`}>{postTitle}</h2>
                      {excerpt ? <p className={`m-0 text-base leading-7 ${bodyTone}`}>{excerpt}</p> : null}
                      {post.tags.length ? (
                        <p className={`m-0 mt-auto pt-2 text-xs uppercase tracking-[0.08em] ${bodyTone}`}>
                          {post.tags.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
