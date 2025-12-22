import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Team } from './types'

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all(),
    queryFn: () => apiClient.get<Team[]>('/teams'),
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: queryKeys.teams.detail(id),
    queryFn: () => apiClient.get<Team>(`/teams/${id}`),
    enabled: !!id,
  })
}

