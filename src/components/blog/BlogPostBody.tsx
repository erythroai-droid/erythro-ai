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

        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[1170px] flex-col gap-12 px-[30px] py-12 md:gap-16 md:py-16 lg:gap-20 lg:py-20">
          <nav
            aria-label="Breadcrumb"
            className={`text-xs uppercase ${
              isLight ? 'text-gold-900' : 'text-gold-800'
            }`}
          >
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              <li>
                <Link
                  href="/"
                  className={
                    isLight
                      ? 'text-coal-900 hover:text-erythro-500'
                      : 'text-gold-100 hover:text-gold-500'
                  }
                >
                  Erythro.ai
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href="/blog"
                  className={
                    isLight
                      ? 'text-coal-900 hover:text-erythro-500'
                      : 'text-gold-100 hover:text-gold-500'
                  }
                >
                  {tBlog(blogUi.indexTitle, locale)}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="min-w-0 truncate" aria-current="page">
                {title}
              </li>
            </ol>
          </nav>

          <header className="flex flex-col gap-6 md:gap-8">
            <h1 className="m-0 font-sans text-[28px] font-extralight uppercase leading-tight tracking-normal md:text-[40px] lg:text-[48px]">
              <span className="text-erythro-500">{title.charAt(0)}</span>
              <span>{title.slice(1)}</span>
            </h1>
            {excerpt ? (
              <div className="font-sans text-lg font-light leading-8 text-gold-500 md:text-xl md:leading-9">
                {excerpt}
              </div>
            ) : null}
            <div
              className={`flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs uppercase ${
                isLight ? 'text-gold-900' : 'text-gold-800'
              }`}
            >
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
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-[2px] px-2 py-1 font-sans text-[11px] uppercase ${
                      isLight
                        ? 'bg-coal-900/5 text-coal-900/70'
                        : 'bg-erythro-500/15 text-[#f7bbba]'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {post.cover?.src ? (
            <div className="relative w-full overflow-hidden">
              <Image
                src={post.cover.src}
                alt={post.cover.alt || title}
                width={post.cover.width || 1170}
                height={post.cover.height || 658}
                priority
                className="h-auto w-full"
                sizes="(max-width: 1170px) 100vw, 1170px"
              />
            </div>
          ) : null}

          {hasBody ? (
            <div
              className={`blog-body font-sans text-base font-light leading-7 md:text-lg md:leading-8 [&_:is(h2,h3,h4)]:mt-8 [&_:is(h2,h3,h4)]:mb-3 [&_:is(h2,h3,h4)]:font-extralight [&_:is(h2,h3,h4)]:uppercase [&_:is(h2,h3,h4)]:tracking-normal [&_p]:m-0 [&_p+_p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-5 [&_li]:my-1 [&_a]:underline [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-s-2 [&_blockquote]:border-erythro-500 [&_blockquote]:ps-4 [&_blockquote]:italic [&_img]:mt-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-[10px] [&_img]:shadow-[0_6px_20px_rgba(0,0,0,0.18)] [&_picture]:mt-4 [&_picture]:block [&_picture]:max-w-full [&_video]:mt-4 [&_video]:h-auto [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-[10px] [&_video]:shadow-[0_6px_20px_rgba(0,0,0,0.18)] ${
                isLight
                  ? 'text-coal-900/85 [&_:is(h2,h3,h4)]:text-coal-900'
                  : 'text-white/80 [&_:is(h2,h3,h4)]:text-white'
              }`}
            >
              <RichText data={bodyDoc as never} converters={richTextConverters} />
            </div>
          ) : null}

          {post.relatedLinks.length ? (
            <aside className="flex flex-col gap-6 border-t border-current/15 pt-10">
              <h2 className="m-0 font-sans text-[22px] font-extralight uppercase tracking-normal md:text-[28px]">
                <span className="text-erythro-500">
                  {tBlog(blogUi.relatedHeading, locale).charAt(0)}
                </span>
                <span>{tBlog(blogUi.relatedHeading, locale).slice(1)}</span>
              </h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {post.relatedLinks.map((link) => {
                  const external = /^https?:\/\//i.test(link.href)
                  const className = `inline-flex items-center gap-2 font-sans text-sm font-medium uppercase transition-colors ${
                    isLight
                      ? 'text-coal-900 hover:text-erythro-500'
                      : 'text-gold-100 hover:text-gold-500'
                  }`
                  return (
                    <li key={link.href}>
                      {external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {tBlog(link.label, locale)}
                          <span aria-hidden>→</span>
                        </a>
                      ) : (
                        <Link href={link.href} className={className}>
                          {tBlog(link.label, locale)}
                          <span aria-hidden>→</span>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </aside>
          ) : null}

          <div>
            <Link
              href="/blog"
              className={`inline-flex items-center justify-center gap-2 select-none font-button-base font-medium uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none cursor-pointer active:scale-[0.97] active:duration-100 ${
                isLight
                  ? 'rounded-[var(--xl,40px)] border border-[var(--gold-100,#fff)] bg-erythro-500 px-8 py-3 text-white hover:border-erythro-500 hover:bg-erythro-500 hover:shadow-[0_3px_20px_0_rgba(255,233,199,0.30)] active:bg-erythro-700 active:border-erythro-700'
                  : 'rounded-[var(--xl,40px)] border border-gold-500 bg-transparent px-8 py-3 text-gold-500 hover:border-[var(--Button-Primary-stroke-hover,#FFE9C7)] hover:bg-[var(--Button-Primary-hover,#FFE9C7)] hover:text-coal-900 hover:shadow-[0_3px_20px_0_var(--Buttons-Primary,rgba(255,233,199,0.30))]'
              }`}
            >
              ← {tBlog(blogUi.backToBlog, locale)}
            </Link>
          </div>
        </div>

        <div
          className="h-20 w-full shrink-0 md:h-24 lg:h-[48vh] lg:min-h-[280px]"
          aria-hidden
        />
      </article>

      {post.faq?.items?.length ? (
        <PageFaqSection block={post.faq} locale={locale} theme={theme} />
      ) : null}
    </>
  )
}
