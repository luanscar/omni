import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { queryKeys } from '@/lib/query/keys'
import type { Contact } from './types'

export function useContacts() {
  return useQuery({
    queryKey: queryKeys.contacts.all(),
    queryFn: () => apiClient.get<Contact[]>('/contacts'),
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => apiClient.get<Contact>(`/contacts/${id}`),
    enabled: !!id,
  })
}

