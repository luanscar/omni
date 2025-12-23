import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getToken } from '@/hooks/use-auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
})

// Request interceptor para adicionar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Log de requisições para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        hasToken: !!token,
      })
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log de erros para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const errorInfo = {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code,
        response_data: error.response?.data,
        request_data: error.config?.data,
        headers: error.response?.headers,
      }
      
      // Se o objeto estiver vazio, tentar serializar o erro completo
      const hasData = Object.values(errorInfo).some(v => v !== undefined && v !== null)
      if (!hasData) {
        try {
          console.error('API Error (Full):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        } catch {
          console.error('API Error (Raw):', error)
        }
      } else {
        console.error('API Error:', errorInfo)
      }
    }

    if (error.response?.status === 401) {
      // Token inválido ou expirado
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        // Opcional: redirecionar para login
        // window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper methods com tipagem
export const apiClient = {
  get: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig
  ) => api.post<T>(url, data, config).then((res) => res.data),

  patch: <T = unknown>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig
  ) => api.patch<T>(url, data, config).then((res) => res.data),

  delete: <T = unknown>(url: string, config?: InternalAxiosRequestConfig) => {
    return api
      .delete<T>(url, {
        ...config,
        // Garantir que não há body no DELETE
        data: undefined,
      })
      .then((res) => {
        // DELETE pode retornar 200 sem body, então retornamos a resposta completa ou um objeto vazio
        return (res.data !== undefined && res.data !== '') ? res.data : ({} as T)
      })
      .catch((error: AxiosError) => {
        // Log específico para erros de DELETE
        if (process.env.NODE_ENV === 'development') {
          console.error('DELETE Error:', {
            url: `${api.defaults.baseURL}${url}`,
            method: 'DELETE',
            error: error.message,
            code: error.code,
            response: error.response?.data,
            status: error.response?.status,
            requestConfig: {
              headers: error.config?.headers,
              baseURL: error.config?.baseURL,
            },
          })
        }
        throw error
      })
  },

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: InternalAxiosRequestConfig
  ) => api.put<T>(url, data, config).then((res) => res.data),
}

