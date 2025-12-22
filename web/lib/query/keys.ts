export const queryKeys = {
  auth: {
    all: () => ['auth'] as const,
  },
  users: {
    all: () => ['users'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  tenants: {
    all: () => ['tenants'] as const,
    detail: (id: string) => ['tenants', id] as const,
  },
  channels: {
    all: () => ['channels'] as const,
    detail: (id: string) => ['channels', id] as const,
  },
  whatsapp: {
    all: () => ['whatsapp'] as const,
    status: (channelId: string) => ['whatsapp', 'status', channelId] as const,
    qr: (channelId: string) => ['whatsapp', 'qr', channelId] as const,
  },
  storage: {
    all: () => ['storage'] as const,
    detail: (id: string) => ['storage', id] as const,
    download: (id: string) => ['storage', 'download', id] as const,
  },
  teams: {
    all: () => ['teams'] as const,
    detail: (id: string) => ['teams', id] as const,
    members: (id: string) => ['teams', id, 'members'] as const,
  },
  contacts: {
    all: () => ['contacts'] as const,
    detail: (id: string) => ['contacts', id] as const,
  },
  conversations: {
    all: () => ['conversations'] as const,
    detail: (id: string) => ['conversations', id] as const,
    byStatus: (status?: string) => ['conversations', status || 'all'] as const,
  },
  messages: {
    all: () => ['messages'] as const,
    byConversation: (conversationId: string) =>
      ['messages', 'conversation', conversationId] as const,
  },
  plans: {
    all: () => ['plans'] as const,
    detail: (id: string) => ['plans', id] as const,
  },
  subscriptions: {
    all: () => ['subscriptions'] as const,
    my: () => ['subscriptions', 'my'] as const,
  },
  audit: {
    all: () => ['audit'] as const,
    logs: (params?: Record<string, unknown>) =>
      ['audit', 'logs', params] as const,
    stats: (startDate: string, endDate: string) =>
      ['audit', 'stats', startDate, endDate] as const,
    detail: (id: string) => ['audit', 'logs', id] as const,
  },
} as const

