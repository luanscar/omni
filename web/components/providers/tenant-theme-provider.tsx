'use client'

import { useTenantTheme } from '@/hooks/use-tenant-theme'

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  useTenantTheme() // Aplica o tema automaticamente
  return <>{children}</>
}

