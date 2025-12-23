'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useConfirmCheckoutSession, useMySubscription } from '@/lib/api/modules/subscriptions'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const confirmSession = useConfirmCheckoutSession()
  const queryClient = useQueryClient()
  const { refetch } = useMySubscription()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(sessionId ? 'loading' : 'error')
  const [errorMessage, setErrorMessage] = useState<string>(sessionId ? '' : 'ID da sessão não encontrado')
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Evitar execução múltipla
    if (hasProcessed.current) {
      return
    }

    if (!sessionId) {
      // Já inicializamos com erro se não tiver session id, ou tratamos na renderização
      return
    }

    hasProcessed.current = true

    // Tentar confirmar a sessão
    const confirm = async () => {
      try {
        // Primeiro, tentar confirmar a sessão manualmente
        // Isso salvará a subscription no banco
        await confirmSession.mutateAsync(sessionId)

        // Invalidar o cache da subscription para forçar refetch
        queryClient.invalidateQueries({
          queryKey: queryKeys.subscriptions.my(),
        })

        // Aguardar um pouco e verificar se a subscription foi criada
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Refetch da subscription
        const { data: updatedSubscription } = await refetch()

        if (updatedSubscription) {
          setStatus('success')
          // Invalidar novamente para garantir que todos os componentes vejam a atualização
          queryClient.invalidateQueries({
            queryKey: queryKeys.subscriptions.my(),
          })
          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push('/dashboard/subscriptions')
          }, 2000)
        } else {
          // Se ainda não tiver subscription, aguardar mais um pouco (webhook pode estar processando)
          let attempts = 0
          const maxAttempts = 5

          while (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            // Invalidar cache antes de cada tentativa
            queryClient.invalidateQueries({
              queryKey: queryKeys.subscriptions.my(),
            })
            const { data: sub } = await refetch()

            if (sub) {
              setStatus('success')
              queryClient.invalidateQueries({
                queryKey: queryKeys.subscriptions.my(),
              })
              setTimeout(() => {
                router.push('/dashboard/subscriptions')
              }, 2000)
              return
            }

            attempts++
          }

          // Se após várias tentativas ainda não tiver subscription, mostrar erro
          setStatus('error')
          setErrorMessage('Assinatura ainda não foi processada. Aguarde alguns instantes e verifique na página de assinaturas.')
        }
      } catch (error: unknown) {
        console.error('Erro ao confirmar sessão:', error)

        // Se o erro for que a sessão já foi processada ou não pertence ao tenant,
        // tentar apenas verificar se já existe subscription
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string }
          
          if (axiosError.response?.status === 400 || axiosError.response?.status === 404) {
            // Invalidar cache
            queryClient.invalidateQueries({
              queryKey: queryKeys.subscriptions.my(),
            })
            // Aguardar e verificar se já existe subscription (webhook pode ter processado)
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const { data: sub } = await refetch()

            if (sub) {
              setStatus('success')
              queryClient.invalidateQueries({
                queryKey: queryKeys.subscriptions.my(),
              })
              setTimeout(() => {
                router.push('/dashboard/subscriptions')
              }, 2000)
              return
            }
          }

          setStatus('error')
          setErrorMessage(
            axiosError.response?.data?.message ||
            axiosError.message ||
            'Erro ao processar assinatura. Tente novamente.'
          )
        } else {
          setStatus('error')
          setErrorMessage(
            error instanceof Error ? error.message : 'Erro ao processar assinatura. Tente novamente.'
          )
        }
      }
    }

    confirm()
  }, [sessionId, confirmSession, refetch, router, queryClient])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Processando Assinatura</CardTitle>
          <CardDescription>
            Aguarde enquanto processamos sua assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Confirmando sua assinatura...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-sm font-medium">
                Assinatura confirmada com sucesso!
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Redirecionando para a página de assinaturas...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-sm font-medium text-destructive">
                {errorMessage}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/subscriptions')}
                >
                  Ir para Assinaturas
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setStatus('loading')
                    setErrorMessage('')
                    window.location.reload()
                  }}
                >
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
