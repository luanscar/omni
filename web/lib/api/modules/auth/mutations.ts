import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { setToken } from '@/hooks/use-auth'
import type { LoginDto, LoginResponse } from './types'

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginDto): Promise<LoginResponse> => {
      const result = await apiClient.post<LoginResponse>('/auth/login', data)
      // Salvar token no localStorage
      if (result.access_token) {
        setToken(result.access_token)
      }
      return result
    },
  })
}

