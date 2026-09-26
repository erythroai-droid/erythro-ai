'use client'

import React, { useState } from 'react'
import { tLocale, tLocaleList } from '@/lib/servicePages'
import type { PageFaqBlock } from '@/lib/pageFaq'

type PageFaqSectionProps = {
  block: PageFaqBlock
  locale: string
  theme?: 'light' | 'dark'
}

export default function PageFaqSection({ block, locale, theme = 'dark' }: PageFaqSectionProps) {
  const isLight = theme === 'light'
  const [openIndex, setOpenIndex] = useState(0)
  const title = tLocale(block.title, locale)

  return (
    <section
      id="page-faq"
      aria-labelledby="page-faq-title"
      data-menu-contrast={isLight ? 'light' : 'dark'}
      className={`relative z-10 w-full shadow-[0_-12px_30px_rgba(0,0,0,0.28)] ${
        isLight ? 'bg-gold-100 text-coal-900' : 'dark-gradient-bg text-white'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-8 px-[30px] py-12 md:gap-10 md:py-16 lg:py-20">
        <h2
          id="page-faq-title"
          className="m-0 text-center font-sans text-[28px] font-extralight uppercase leading-tight tracking-[0.08em] md:text-[40px]"
        >
          <span className="text-erythro-500">{title.charAt(0)}</span>
          <span>{title.slice(1)}</span>
        </h2>

        <div
          className={`mx-auto w-full max-w-[970px] overflow-hidden rounded-[10px] border ${
            isLight
              ? 'border-coal-900/10 bg-white shadow-[0_14px_44px_rgba(13,13,13,0.10)]'
              : 'border-white/10 bg-coal-500 shadow-[0_14px_44px_rgba(13,13,13,0.45)]'
          }`}
        >
          {block.items.map((item, index) => {
            const question = tLocale(item.question, locale)
            const answer = tLocale(item.answer, locale)
            const details = tLocaleList(item.details, locale)
            const isOpen = openIndex === index

            return (
              <div
                key={question}
                className={
                  index > 0
                    ? isLight
                      ? 'border-t border-coal-900/10'
                      : 'border-t border-white/10'
                    : undefined
                }
              >
                <h3 className="m-0 font-sans text-[15px] font-bold leading-6 tracking-[0.02em] md:text-base">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className={`group flex w-full cursor-pointer items-center justify-between gap-6 px-6 py-5 text-start transition-colors duration-300 md:px-8 ${
                      isLight ? 'hover:bg-erythro-500/5' : 'hover:bg-gold-500/10'
                    }`}
                    aria-expanded={isOpen}
                    aria-controls={`page-faq-answer-${index}`}
                  >
                    <span
                      className={`min-w-0 flex-1 transition-colors duration-300 ${
                        isLight
                          ? 'text-coal-900 group-hover:text-erythro-500'
                          : 'text-white group-hover:text-gold-500'
                      }`}
                    >
                      {question}
                    </span>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? isLight
                            ? 'border-erythro-500 bg-erythro-500 text-white'
                            : 'border-gold-500 bg-gold-500 text-coal-900'
                          : isLight
                            ? 'border-coal-900/10 bg-gold-100 text-coal-900 group-hover:border-erythro-500 group-hover:bg-erythro-500 group-hover:text-white'
                            : 'border-white/15 bg-white/5 text-white group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-coal-900'
                      }`}
                      aria-hidden
                    >
                      <svg
                        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 5V19M5 12H19"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                <div
                  id={`page-faq-answer-${index}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 md:px-8">
                      <div
                        className={`max-w-[820px] font-sans text-base font-light leading-7 md:text-lg md:leading-8 ${
                          isLight ? 'text-coal-900/80' : 'text-white/75'
                        }`}
                      >
                        <p className="m-0">{answer}</p>
                        {details.length ? (
                          <ul className="my-3 list-disc ps-5">
                            {details.map((line) => (
                              <li key={line} className="my-1">
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
