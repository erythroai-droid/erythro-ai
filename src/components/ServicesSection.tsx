'use client'

import React from 'react'
import Button from './Button'

import { ServiceItem, services as translations } from '../translations'

interface ServicesSectionProps {
  locale: string
}

export default function ServicesSection({ locale }: ServicesSectionProps) {
  // Translate helper
  const t = (field: Record<string, string>) => field[locale] || field['en']

  const { sectionTitle, sectionSubtitle, startCTA, priceLabel, items } = translations

  return (
    <section id="services" className="bg-noise py-20 lg:py-32 w-full transition-colors duration-300 bg-primary">
      <div className="max-w-[1170px] mx-auto px-[30px]">
        {/* Headings grid */}
        <div className="mb-16 text-center max-w-2xl mx-auto flex flex-col items-center gap-4">
          <h2 className="font-heading-3xl text-erythro-500 tracking-widest font-extralight uppercase">
            {t(sectionTitle)}
          </h2>
          <p className="font-body-lead text-coal-300 dark:text-gold-700 tracking-wider">
            {t(sectionSubtitle)}
          </p>
        </div>

        {/* 12-column grid system matching foundations-geometry.md */}
        <div className="grid grid-cols-12 gap-[30px] items-stretch">
          {items.map((service, index) => {
            return (
              <div
                key={service.id}
                className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col justify-between p-8 bg-surface rounded-radius-lg border border-coal-400/10 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-services-light dark:hover:shadow-card-services-dark group panel-glass"
              >
                <div>
                  {/* Category tag */}
                  <span className="inline-block px-3 py-1 mb-6 text-[10px] tracking-widest font-mono text-erythro-500 dark:text-gold-500 border border-erythro-500/20 rounded-radius-sm bg-erythro-500/5">
                    {t(service.category)}
                  </span>

                  {/* Title */}
                  <h3 className="font-sans text-xl lg:text-2xl font-bold tracking-tight mb-4 text-coal-900 dark:text-gold-100 group-hover:text-erythro-500 transition-colors duration-300">
                    {t(service.title)}
                  </h3>

                  {/* Description */}
                  <p className="font-sans text-sm text-coal-300 dark:text-gold-700 leading-relaxed mb-8">
                    {t(service.description)}
                  </p>
                </div>

                <div>
                  {/* Divider line */}
                  <div className="w-full h-px bg-coal-400/10 dark:bg-white/5 mb-6" />

                  {/* Pricing and CTA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-caption-sm text-coal-200 dark:text-gold-800 uppercase tracking-widest">
                        {t(priceLabel)}
                      </span>
                      <span className="font-accent-label-xl text-erythro-500 dark:text-gold-500 font-extrabold">
                        ${service.price.toLocaleString()}
                      </span>
                    </div>

                    <Button variant="dark-outline" showArrow className="w-full sm:w-auto">
                      {t(startCTA)}
                    </Button>
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
