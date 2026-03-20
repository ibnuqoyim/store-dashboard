'use client'

import { createContext, useContext } from 'react'
import { BusinessConfig, DEFAULT_CONFIG } from './config'

const BusinessConfigContext = createContext<BusinessConfig>(DEFAULT_CONFIG)

export function BusinessConfigProvider({ config, children }: {
  config: BusinessConfig
  children: React.ReactNode
}) {
  return (
    <BusinessConfigContext.Provider value={config}>
      {children}
    </BusinessConfigContext.Provider>
  )
}

export function useBusinessConfig(): BusinessConfig {
  return useContext(BusinessConfigContext)
}
