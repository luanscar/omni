'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useMyTenant } from '@/lib/api/modules/tenants/queries'
import type { TenantTheme } from '@/lib/api/modules/tenants/types'
import { getThemePreset, getDefaultThemePreset } from '@/lib/themes'

export function useTenantTheme() {
  const { data: tenant } = useMyTenant()
  const { theme: currentTheme, systemTheme } = useTheme()

  useEffect(() => {
    const root = document.documentElement

    // Determinar qual tema usar (light ou dark)
    const themeMode =
      currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
        ? 'dark'
        : 'light'

    // Mapear propriedades do tema para variáveis CSS
    const cssVarMap: Record<string, keyof TenantTheme> = {
      '--radius': 'radius',
      '--background': 'background',
      '--foreground': 'foreground',
      '--card': 'card',
      '--card-foreground': 'cardForeground',
      '--popover': 'popover',
      '--popover-foreground': 'popoverForeground',
      '--primary': 'primary',
      '--primary-foreground': 'primaryForeground',
      '--secondary': 'secondary',
      '--secondary-foreground': 'secondaryForeground',
      '--muted': 'muted',
      '--muted-foreground': 'mutedForeground',
      '--accent': 'accent',
      '--accent-foreground': 'accentForeground',
      '--destructive': 'destructive',
      '--border': 'border',
      '--input': 'input',
      '--ring': 'ring',
      '--chart-1': 'chart1',
      '--chart-2': 'chart2',
      '--chart-3': 'chart3',
      '--chart-4': 'chart4',
      '--chart-5': 'chart5',
      '--sidebar': 'sidebar',
      '--sidebar-foreground': 'sidebarForeground',
      '--sidebar-primary': 'sidebarPrimary',
      '--sidebar-primary-foreground': 'sidebarPrimaryForeground',
      '--sidebar-accent': 'sidebarAccent',
      '--sidebar-accent-foreground': 'sidebarAccentForeground',
      '--sidebar-border': 'sidebarBorder',
      '--sidebar-ring': 'sidebarRing',
    }

    let themeVars: TenantTheme | undefined

    // Se há um themePresetId, usar o tema pré-definido
    if (tenant?.settings?.themePresetId) {
      const preset = getThemePreset(tenant.settings.themePresetId)
      if (preset) {
        themeVars = preset[themeMode]
      }
    }

    // Se não encontrou preset ou há tema customizado, usar tema customizado
    if (!themeVars && tenant?.settings?.theme?.[themeMode]) {
      themeVars = tenant.settings.theme[themeMode]
    }

    // Se não há tema customizado nem preset, usar padrão
    if (!themeVars) {
      const defaultPreset = getDefaultThemePreset()
      themeVars = defaultPreset[themeMode]
    }

    // Se não há tema, remover todas as customizações
    if (!themeVars) {
      Object.keys(cssVarMap).forEach((cssVar) => {
        root.style.removeProperty(cssVar)
      })
      return
    }

    // Aplicar variáveis CSS customizadas
    Object.entries(cssVarMap).forEach(([cssVar, themeKey]) => {
      const value = themeVars![themeKey]
      if (value) {
        root.style.setProperty(cssVar, value)
      } else {
        // Se a propriedade não está no tema customizado, remover override
        root.style.removeProperty(cssVar)
      }
    })

    // Cleanup: remover customizações quando tenant/settings mudar ou componente desmontar
    return () => {
      Object.keys(cssVarMap).forEach((cssVar) => {
        root.style.removeProperty(cssVar)
      })
    }
  }, [tenant?.settings?.theme, tenant?.settings?.themePresetId, currentTheme, systemTheme])
}
