'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blogPosts'
import { blogUi, formatBlogDate, tBlog } from '@/lib/blogPosts'
import StylizedSectionTitle from '@/components/StylizedSectionTitle'
import BlogPagination from '@/components/blog/BlogPagination'

type Props = {
  locale: string
  theme: 'light' | 'dark'
  posts: BlogPost[]
  page?: number
  totalPages?: number
}

export default function BlogIndexBody({
  locale,
  theme,
  posts,
  page = 1,
  totalPages = 1,
}: Props) {
  const isLight = theme === 'light'
  const title = tBlog(blogUi.indexTitle, locale)
  const description = tBlog(blogUi.indexDescription, locale)
  const moreLabel = locale === 'he' ? 'עוד' : locale === 'ru' ? 'подробнее' : 'more'
  const isRtl = locale === 'he'

  return (
    <section
      id="blog"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-20 min-h-screen w-full overflow-hidden ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      {!isLight && (
        <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-[1170px] flex-col items-center px-[30px] pb-16 pt-10 lg:pb-24 lg:pt-12">
        <header className="mb-10 flex flex-col items-center gap-[5px] text-center lg:mb-14">
          <h1 className="m-0 font-sans text-[32px] font-extralight uppercase leading-tight tracking-normal lg:text-[48px] lg:leading-[60px]">
            <StylizedSectionTitle
              text={title.toUpperCase()}
              restClassName={isLight ? 'text-coal-900' : 'text-white'}
            />
          </h1>
          <p
            className={`m-0 max-w-3xl font-sans text-sm font-light leading-relaxed lg:text-base lg:leading-8 ${
              isLight ? 'text-gold-900' : 'text-gold-800'
            }`}
          >
            {description}
          </p>
        </header>

        {posts.length === 0 ? (
          <div
            className={`w-full rounded-[20px] border border-white/5 p-8 text-center shadow-card-services-dark ${
              isLight ? 'bg-white' : ''
            }`}
            style={!isLight ? { background: 'var(--service-card-bg)' } : undefined}
          >
            <h2 className="m-0 font-sans text-xl font-extralight uppercase tracking-normal">
              <span className="text-erythro-500">{tBlog(blogUi.emptyTitle, locale).charAt(0)}</span>
              <span>{tBlog(blogUi.emptyTitle, locale).slice(1)}</span>
            </h2>
            <p
              className={`mx-auto mt-4 max-w-xl font-sans text-sm font-light leading-6 ${
                isLight ? 'text-gold-900' : 'text-gold-800'
              }`}
            >
              {tBlog(blogUi.emptyBody, locale)}
            </p>
            <Link
              href="/audit"
              className={`mt-8 inline-flex items-center gap-2 font-sans text-sm font-medium uppercase transition-colors ${
                isLight ? 'text-coal-900 hover:text-erythro-500' : 'text-gold-100 hover:text-gold-500'
              }`}
            >
              {tBlog(blogUi.emptyCta, locale)}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        ) : (
          <ul className="m-0 flex w-full list-none flex-col gap-6 p-0 lg:gap-10">
            {posts.map((post) => {
              const postTitle = tBlog(post.title, locale)
              const excerpt = tBlog(post.excerpt, locale)
              const date = formatBlogDate(post.publishedAt, locale)

              return (
                <li key={post.slug} className="w-full">
                  <Link
                    href={`/blog/${post.slug}`}
                    className={`group relative flex w-full flex-col overflow-hidden rounded-[20px] border border-white/5 shadow-card-services-dark transition-all duration-500 lg:flex-row lg:items-stretch ${
                      isLight
                        ? 'hover:border-white/70 hover:shadow-[0_0_30px_0_rgba(255,255,255,0.35)]'
                        : 'hover:border-erythro-500/30 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.45)]'
                    }`}
                    style={{ background: 'var(--service-card-bg)' }}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-noise opacity-30" aria-hidden />
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent transition-all duration-500 ${
                        isLight ? 'group-hover:to-white/15' : 'group-hover:to-erythro-500/5'
                      }`}
                      aria-hidden
                    />

                    {post.cover?.src ? (
                      <div
                        className={`relative flex w-full shrink-0 items-center overflow-hidden border-white/5 lg:w-[42%] lg:self-stretch lg:border-b-0 ${
                          isRtl
                            ? 'rounded-t-[20px] border-b lg:rounded-t-none lg:rounded-e-[20px] lg:border-s'
                            : 'rounded-t-[20px] border-b lg:rounded-t-none lg:rounded-s-[20px] lg:border-e'
                        }`}
                      >
                        <Image
                          src={post.cover.src}
                          alt={post.cover.alt || postTitle}
                          width={post.cover.width || 1170}
                          height={post.cover.height || 658}
                          className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 490px"
                        />
                      </div>
                    ) : null}

                    <div className="relative z-10 flex w-full flex-1 flex-col justify-between gap-6 p-6 lg:p-10">
                      <div className="flex flex-col gap-4">
                        <h2 className="m-0 font-sans text-xl font-extralight normal-case leading-tight tracking-normal text-[var(--service-card-header,#0D0D0D)] lg:text-[32px] lg:leading-10">
                          {postTitle}
                        </h2>
                        {excerpt ? (
                          <p className="m-0 font-sans text-sm font-normal leading-6 text-[var(--service-card-list,#1E1E1E)] lg:text-[14px] lg:leading-6">
                            {excerpt}
                          </p>
                        ) : null}
                        {post.tags.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {post.tags.slice(0, 6).map((tag) => (
                              <span
                                key={tag}
                                className={`rounded-[2px] px-2 py-1 font-sans text-[11px] uppercase ${
                                  isLight
                                    ? 'bg-coal-900/5 text-coal-900/70'
                                    : 'bg-white/5 text-white/60'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div
                        dir="ltr"
                        className="flex w-full items-center justify-between gap-4"
                      >
                        {date ? (
                          <time
                            dateTime={post.publishedAt || undefined}
                            className={`shrink-0 font-sans text-xs ${
                              isLight ? 'text-gold-900' : 'text-gold-800'
                            }`}
                          >
                            {date}
                          </time>
                        ) : (
                          <span aria-hidden className="shrink-0" />
                        )}
                        <span
                          className={`inline-flex shrink-0 items-center gap-2 font-sans text-sm font-medium transition-colors ${
                            isLight
                              ? 'text-coal-900 group-hover:text-erythro-500'
                              : 'text-gold-100 group-hover:text-gold-500'
                          }`}
                        >
                          {moreLabel}
                          <span
                            aria-hidden
                            className="transition-transform group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        <BlogPagination locale={locale} theme={theme} page={page} totalPages={totalPages} />
      </div>

      <div className="relative z-10 h-[150px] w-full shrink-0" aria-hidden />
    </section>
  )
}
