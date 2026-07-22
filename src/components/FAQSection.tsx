'use client'

import React, { useState } from 'react'
import { useSiteContent } from './SiteContentProvider'

interface FAQSectionProps {
  locale: string
}

export default function FAQSection({ locale }: FAQSectionProps) {
  const translations = useSiteContent().faq
  const t = (field: Record<string, string>) => field[locale] || field['en']
  const [openIndex, setOpenIndex] = useState<number>(0)

  const renderStylizedTitle = (text: string) => {
    const firstChar = text.charAt(0)
    const rest = text.slice(1)
    return (
      <>
        <span className="text-erythro-500">{firstChar}</span>
        <span className="text-coal-900">{rest}</span>
      </>
    )
  }

  return (
    <section
      id="faq"
      className="relative z-10 w-full border-t border-b border-coal-400/5 bg-gold-100 select-none"
    >
      <div className="mx-auto flex w-full max-w-[1170px] flex-col gap-10 px-[30px] py-16 md:gap-12 lg:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
          <h2 className="font-sans text-[32px] font-extralight uppercase leading-tight tracking-[9.6px] text-coal-900 lg:text-[40px] lg:leading-[50px]">
            {renderStylizedTitle(t(translations.sectionTitle))}
          </h2>
          <p className="font-sans text-sm font-light leading-relaxed tracking-[3.2px] text-gold-800 lg:text-base lg:leading-[28px]">
            {t(translations.sectionSubtitle)}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-[970px] flex-col overflow-hidden rounded-[20px] border border-coal-900/10 bg-white shadow-[0_14px_44px_rgba(13,13,13,0.10)]">
          {translations.items.map((item, index) => {
            const isOpen = openIndex === index
            const question = t(item.question)

            return (
              <div
                key={`${index}-${question}`}
                className={`${index > 0 ? 'border-t border-coal-900/10' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-start transition-colors duration-300 hover:bg-gold-100/60 md:px-8"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-sans text-[15px] font-bold uppercase leading-6 tracking-[0.06em] text-coal-900 md:text-base">
                    {question}
                  </span>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? 'border-erythro-500 bg-erythro-500 text-white'
                        : 'border-coal-900/10 bg-gold-100 text-coal-900'
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

                <div
                  id={`faq-answer-${index}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 md:px-8">
                      <p className="max-w-[820px] font-sans text-base font-light leading-7 text-coal-900/80 md:text-lg md:leading-8">
                        {t(item.answer)}
                      </p>
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
