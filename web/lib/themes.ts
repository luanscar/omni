import type { TenantTheme } from '@/lib/api/modules/tenants/types'

export interface ThemePreset {
  id: string
  name: string
  light: TenantTheme
  dark: TenantTheme
}

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    light: {
      primary: 'oklch(0.488 0.243 264.376)',
      primaryForeground: 'oklch(0.97 0.014 254.604)',
      secondary: 'oklch(0.967 0.001 286.375)',
      secondaryForeground: 'oklch(0.21 0.006 285.885)',
      accent: 'oklch(0.967 0.001 286.375)',
      accentForeground: 'oklch(0.21 0.006 285.885)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.488 0.243 264.376)',
      primaryForeground: 'oklch(0.97 0.014 254.604)',
      secondary: 'oklch(0.274 0.006 286.033)',
      secondaryForeground: 'oklch(0.985 0 0)',
      accent: 'oklch(0.274 0.006 286.033)',
      accentForeground: 'oklch(0.985 0 0)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
  {
    id: 'blue',
    name: 'Azul',
    light: {
      primary: 'oklch(0.55 0.22 250)',
      primaryForeground: 'oklch(0.98 0.01 250)',
      secondary: 'oklch(0.96 0.01 250)',
      secondaryForeground: 'oklch(0.25 0.02 250)',
      accent: 'oklch(0.96 0.01 250)',
      accentForeground: 'oklch(0.25 0.02 250)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.60 0.20 250)',
      primaryForeground: 'oklch(0.98 0.01 250)',
      secondary: 'oklch(0.28 0.01 250)',
      secondaryForeground: 'oklch(0.98 0.01 250)',
      accent: 'oklch(0.28 0.01 250)',
      accentForeground: 'oklch(0.98 0.01 250)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
  {
    id: 'green',
    name: 'Verde',
    light: {
      primary: 'oklch(0.55 0.22 145)',
      primaryForeground: 'oklch(0.98 0.01 145)',
      secondary: 'oklch(0.96 0.01 145)',
      secondaryForeground: 'oklch(0.25 0.02 145)',
      accent: 'oklch(0.96 0.01 145)',
      accentForeground: 'oklch(0.25 0.02 145)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.60 0.20 145)',
      primaryForeground: 'oklch(0.98 0.01 145)',
      secondary: 'oklch(0.28 0.01 145)',
      secondaryForeground: 'oklch(0.98 0.01 145)',
      accent: 'oklch(0.28 0.01 145)',
      accentForeground: 'oklch(0.98 0.01 145)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
  {
    id: 'purple',
    name: 'Roxo',
    light: {
      primary: 'oklch(0.55 0.22 300)',
      primaryForeground: 'oklch(0.98 0.01 300)',
      secondary: 'oklch(0.96 0.01 300)',
      secondaryForeground: 'oklch(0.25 0.02 300)',
      accent: 'oklch(0.96 0.01 300)',
      accentForeground: 'oklch(0.25 0.02 300)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.60 0.20 300)',
      primaryForeground: 'oklch(0.98 0.01 300)',
      secondary: 'oklch(0.28 0.01 300)',
      secondaryForeground: 'oklch(0.98 0.01 300)',
      accent: 'oklch(0.28 0.01 300)',
      accentForeground: 'oklch(0.98 0.01 300)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
  {
    id: 'orange',
    name: 'Laranja',
    light: {
      primary: 'oklch(0.65 0.20 70)',
      primaryForeground: 'oklch(0.15 0.02 70)',
      secondary: 'oklch(0.96 0.01 70)',
      secondaryForeground: 'oklch(0.25 0.02 70)',
      accent: 'oklch(0.96 0.01 70)',
      accentForeground: 'oklch(0.25 0.02 70)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.70 0.18 70)',
      primaryForeground: 'oklch(0.15 0.02 70)',
      secondary: 'oklch(0.28 0.01 70)',
      secondaryForeground: 'oklch(0.98 0.01 70)',
      accent: 'oklch(0.28 0.01 70)',
      accentForeground: 'oklch(0.98 0.01 70)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
  {
    id: 'red',
    name: 'Vermelho',
    light: {
      primary: 'oklch(0.55 0.22 25)',
      primaryForeground: 'oklch(0.98 0.01 25)',
      secondary: 'oklch(0.96 0.01 25)',
      secondaryForeground: 'oklch(0.25 0.02 25)',
      accent: 'oklch(0.96 0.01 25)',
      accentForeground: 'oklch(0.25 0.02 25)',
      destructive: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.60 0.20 25)',
      primaryForeground: 'oklch(0.98 0.01 25)',
      secondary: 'oklch(0.28 0.01 25)',
      secondaryForeground: 'oklch(0.98 0.01 25)',
      accent: 'oklch(0.28 0.01 25)',
      accentForeground: 'oklch(0.98 0.01 25)',
      destructive: 'oklch(0.704 0.191 22.216)',
    },
  },
]

export function getThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find(preset => preset.id === id)
}

export function getDefaultThemePreset(): ThemePreset {
  return themePresets[0]
}

