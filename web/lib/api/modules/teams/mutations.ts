import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type {
  CreateTeamDto,
  UpdateTeamDto,
  Team,
  AddMemberDto,
} from './types'

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTeamDto) =>
      apiClient.post<Team>('/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamDto }) =>
      apiClient.patch<Team>(`/teams/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(variables.id),
      })
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/teams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all() })
    },
  })
}

export function useAddTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string
      data: AddMemberDto
    }) => apiClient.post(`/teams/${teamId}/members`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(variables.teamId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(variables.teamId),
      })
    },
  })
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teamId,
      userId,
    }: {
      teamId: string
      userId: string
    }) => apiClient.delete(`/teams/${teamId}/members/${userId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(variables.teamId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.members(variables.teamId),
      })
    },
  })
}

