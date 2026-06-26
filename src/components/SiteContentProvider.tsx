'use client'

import React, { createContext, useContext } from 'react'
import { defaultSiteContent, type SiteContent } from '@/lib/defaultContent'

const SiteContentContext = createContext<SiteContent>(defaultSiteContent)

export function SiteContentProvider({
  value,
  children,
}: {
  value?: SiteContent
  children: React.ReactNode
}) {
  return (
    <SiteContentContext.Provider value={value ?? defaultSiteContent}>
      {children}
    </SiteContentContext.Provider>
  )
}

/** Access the full site content (Payload-backed, with static fallback). */
export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext)
}
