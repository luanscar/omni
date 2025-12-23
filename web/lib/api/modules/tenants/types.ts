export interface CreateTenantDto {
  name: string
  slug: string
}

export interface TenantTheme {
  radius?: string
  background?: string
  foreground?: string
  card?: string
  cardForeground?: string
  popover?: string
  popoverForeground?: string
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  muted?: string
  mutedForeground?: string
  accent?: string
  accentForeground?: string
  destructive?: string
  border?: string
  input?: string
  ring?: string
  chart1?: string
  chart2?: string
  chart3?: string
  chart4?: string
  chart5?: string
  sidebar?: string
  sidebarForeground?: string
  sidebarPrimary?: string
  sidebarPrimaryForeground?: string
  sidebarAccent?: string
  sidebarAccentForeground?: string
  sidebarBorder?: string
  sidebarRing?: string
}

export interface TenantSettings {
  chatMode?: 'ATTENDANCE' | 'SIMPLE'
  themePresetId?: string // ID do tema pré-definido
  theme?: {
    light?: TenantTheme
    dark?: TenantTheme
  }
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  settings?: TenantSettings
}

export interface Tenant {
  id: string
  name: string
  slug: string
  active: boolean
  settings?: TenantSettings
  createdAt: string
  updatedAt: string
}

