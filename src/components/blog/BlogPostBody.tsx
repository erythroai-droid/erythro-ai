'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { richTextConverters } from '@/lib/richTextConverters'
import { isLexicalDoc } from '@/lib/lexical'
import type { BlogPost } from '@/lib/blogPosts'
import { blogUi, formatBlogDate, tBlog } from '@/lib/blogPosts'
import PageFaqSection from '@/components/PageFaqSection'

type Props = {
  locale: string
  theme: 'light' | 'dark'
  post: BlogPost
}

export default function BlogPostBody({ locale, theme, post }: Props) {
  const isLight = theme === 'light'
  const title = tBlog(post.title, locale)
  const excerpt = tBlog(post.excerpt, locale)
  const published = formatBlogDate(post.publishedAt, locale)
  const updated = formatBlogDate(post.updatedAt, locale)
  const headingTone = isLight ? 'text-coal-900' : 'text-white'
  const bodyTone = isLight ? 'text-coal-900/80' : 'text-white/80'
  const linkClass = isLight
    ? 'text-erythro-500 hover:text-coal-900'
    : 'text-gold-500 hover:text-white'

  const bodyDoc = post.body?.[locale] ?? post.body?.en
  const hasBody = isLexicalDoc(bodyDoc)

  return (
    <>
      <article
        id="blog-post"
        data-menu-contrast={isLight ? 'light' : 'dark'}
        className={`relative z-20 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
          isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
        }`}
      >
        {!isLight && (
          <div className="solution-section-noise absolute inset-0 z-[1] pointer-events-none" aria-hidden />
        )}

        <div className="relative z-10 mx-auto flex w-full max-w-[800px] flex-col gap-8 px-[30px] py-12 md:gap-10 md:py-16 lg:py-20">
          <nav aria-label="Breadcrumb" className={`text-sm ${bodyTone}`}>
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              <li>
                <Link href="/" className={linkClass}>
                  Erythro.ai
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className={linkClass}>
                  {tBlog(blogUi.indexTitle, locale)}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="min-w-0 truncate" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>

          <header className="flex flex-col gap-4">
            <h1 className={`m-0 font-sans text-[28px] font-medium leading-tight tracking-[-0.02em] md:text-[40px] ${headingTone}`}>
              {title}
            </h1>
            {excerpt ? (
              <p className={`m-0 text-lg font-light leading-8 md:text-xl md:leading-9 ${bodyTone}`}>{excerpt}</p>
            ) : null}
            <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${bodyTone}`}>
              {published ? (
                <span>
                  {tBlog(blogUi.publishedLabel, locale)}{' '}
                  <time dateTime={post.publishedAt || undefined}>{published}</time>
                </span>
              ) : null}
              {updated && post.updatedAt !== post.publishedAt ? (
                <span>
                  {tBlog(blogUi.updatedLabel, locale)}{' '}
                  <time dateTime={post.updatedAt || undefined}>{updated}</time>
                </span>
              ) : null}
            </div>
            {post.tags.length ? (
              <p className={`m-0 text-xs uppercase tracking-[0.1em] ${bodyTone}`}>{post.tags.join(' · ')}</p>
            ) : null}
          </header>

          {post.cover?.src ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px]">
              <Image
                src={post.cover.src}
                alt={post.cover.alt || title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 800px) 100vw, 800px"
              />
            </div>
          ) : null}

          {hasBody ? (
            <div
              className={`blog-body font-sans text-base font-light leading-8 md:text-lg md:leading-9 [&_:is(h2,h3,h4)]:mt-8 [&_:is(h2,h3,h4)]:mb-3 [&_:is(h2,h3,h4)]:font-medium [&_:is(h2,h3,h4)]:tracking-[-0.01em] [&_p]:m-0 [&_p+_p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-s-2 [&_blockquote]:border-erythro-500 [&_blockquote]:ps-4 [&_blockquote]:italic ${
                isLight ? 'text-coal-900/85 [&_:is(h2,h3,h4)]:text-coal-900' : 'text-white/80 [&_:is(h2,h3,h4)]:text-white'
              }`}
            >
              <RichText data={bodyDoc as never} converters={richTextConverters} />
            </div>
          ) : null}

          {post.relatedLinks.length ? (
            <aside className="border-t border-current/10 pt-8">
              <h2 className={`m-0 text-lg font-medium ${headingTone}`}>
                {tBlog(blogUi.relatedHeading, locale)}
              </h2>
              <ul className="mt-4 flex list-none flex-col gap-2 p-0">
                {post.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={`text-base ${linkClass}`}>
                      {tBlog(link.label, locale)} →
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}

          <p className="m-0 pt-2">
            <Link href="/blog" className={`text-base font-medium ${linkClass}`}>
              ← {tBlog(blogUi.backToBlog, locale)}
            </Link>
          </p>
        </div>
      </article>

      {post.faq?.items?.length ? (
        <PageFaqSection block={post.faq} locale={locale} theme={theme} />
      ) : null}
    </>
  )
}
