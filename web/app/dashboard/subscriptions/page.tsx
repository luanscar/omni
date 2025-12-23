'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { usePlans } from '@/lib/api/modules/plans'
import { useMySubscription, useCreateCheckoutSession, useCancelSubscription } from '@/lib/api/modules/subscriptions'
import { PlanType, SubscriptionStatus } from '@/lib/api/types'
import { Check, Loader2, Sparkles, Zap, Crown } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/keys'

function SubscriptionsContent() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { data: plans, isLoading: isLoadingPlans } = usePlans()
  const { data: subscription, refetch } = useMySubscription()
  const createCheckout = useCreateCheckoutSession()
  const cancelSubscription = useCancelSubscription()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const hasProcessedSuccess = useRef(false)

  // Verificar se veio de uma confirmação de checkout bem-sucedida
  useEffect(() => {
    // Verificar apenas uma vez quando o componente monta
    if (hasProcessedSuccess.current) {
      return
    }

    const success = searchParams.get('success')
    if (success === 'true') {
      hasProcessedSuccess.current = true
      // Invalidar cache e refetch da subscription
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.my(),
      })
      // Chamar refetch de forma assíncrona para não bloquear
      refetch().catch(console.error)
      // Remover o parâmetro da URL imediatamente para evitar loop
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('success')
        window.history.replaceState({}, '', url.pathname + url.search)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubscribe = async (planId: string) => {
    try {
      setSelectedPlanId(planId)
      
      // URLs são opcionais - enviar apenas o planId
      // A API usará URLs padrão se não forem fornecidas
      const payload: { planId: string; successUrl?: string; cancelUrl?: string } = {
        planId,
      }
      
      // Não enviar URLs em desenvolvimento local para evitar problemas com o validator
      // O validator @IsUrl() pode rejeitar localhost
      // A API usará URLs padrão se não forem fornecidas
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.startsWith('192.168.') ||
         window.location.hostname.startsWith('10.') ||
         window.location.hostname.startsWith('172.'))
      
      // Apenas enviar URLs se não for localhost (produção)
      if (!isLocalhost && typeof window !== 'undefined' && window.location.origin) {
        try {
          const baseUrl = window.location.origin
          const successUrl = `${baseUrl}/dashboard/subscriptions?success=true`
          const cancelUrl = `${baseUrl}/dashboard/subscriptions?canceled=true`
          
          // Validar URLs antes de adicionar ao payload
          new URL(successUrl)
          new URL(cancelUrl)
          
          // Adicionar apenas se forem válidas e não forem localhost
          if (successUrl.startsWith('https://')) {
            payload.successUrl = successUrl
            payload.cancelUrl = cancelUrl
          }
        } catch {
          // Se não conseguir criar URLs válidas, enviar sem elas (são opcionais)
          console.warn('URLs não puderam ser geradas, enviando sem elas')
        }
      } else {
        console.log('Ambiente local detectado, não enviando URLs (API usará padrão)')
      }
      
      console.log('Enviando payload de checkout:', payload)
      
      const response = await createCheckout.mutateAsync(payload)
      
      // Redirecionar para o checkout do Stripe
      if (response?.url) {
        window.location.href = response.url
      } else {
        throw new Error('URL de checkout não retornada')
      }
    } catch (error: unknown) {
      console.error('Erro ao criar sessão de checkout:', error)
      
      let errorMessage = 'Erro ao processar assinatura. Tente novamente.'
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string | string[] } }; message?: string }
        console.error('Detalhes do erro:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          message: axiosError.message,
        })
        
        if (axiosError.response?.status === 400) {
          const errorData = axiosError.response?.data
          if (Array.isArray(errorData?.message)) {
            errorMessage = errorData.message.join(', ')
          } else if (errorData?.message) {
            errorMessage = errorData.message
          } else {
            errorMessage = 'Dados inválidos. Verifique se o plano existe e se você tem permissão.'
          }
        } else if (axiosError.response?.status === 403) {
          errorMessage = 'Você não tem permissão para criar assinaturas. Apenas administradores podem assinar planos.'
        } else if (axiosError.response?.status === 404) {
          errorMessage = 'Plano não encontrado.'
        } else if (axiosError.response?.data?.message) {
          const message = axiosError.response.data.message
          errorMessage = Array.isArray(message) ? message.join(', ') : message
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      alert(errorMessage)
    } finally {
      setSelectedPlanId(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Ela continuará ativa até o fim do período atual.')) {
      return
    }

    try {
      await cancelSubscription.mutateAsync()
      alert('Assinatura cancelada com sucesso. Ela continuará ativa até o fim do período atual.')
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      alert('Erro ao cancelar assinatura. Tente novamente.')
    }
  }

  const getPlanIcon = (type: PlanType) => {
    switch (type) {
      case PlanType.BASIC:
        return <Zap className="h-5 w-5" />
      case PlanType.MEDIUM:
        return <Sparkles className="h-5 w-5" />
      default:
        return <Crown className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number) => {
    // O preço vem em centavos da API, então dividimos por 100
    const priceInReais = price / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceInReais)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const isCurrentPlan = (planId: string) => {
    return subscription?.planId === planId
  }

  // Considerar ACTIVE e TRIALING como status válidos (assinatura ativa)
  const isSubscriptionActive =
    subscription?.status === SubscriptionStatus.ACTIVE ||
    subscription?.status === SubscriptionStatus.TRIALING

  return (
    <>
      <Header />
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Planos e Assinaturas</h1>
            <p className="text-muted-foreground mt-2">
              Escolha o plano ideal para sua empresa
            </p>
          </div>

          {/* Current Subscription */}
          {subscription && (
            <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-primary" />
                      Assinatura Atual
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {subscription.plan.name}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      subscription.status === SubscriptionStatus.ACTIVE
                        ? 'default'
                        : subscription.status === SubscriptionStatus.CANCELED
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {subscription.status === SubscriptionStatus.ACTIVE
                      ? 'Ativa'
                      : subscription.status === SubscriptionStatus.CANCELED
                      ? 'Cancelada'
                      : subscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Período Atual</p>
                    <p className="mt-1 font-medium">
                      {formatDate(subscription.currentPeriodStart)} -{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Mensal</p>
                    <p className="mt-1 font-medium">
                      {formatPrice(subscription.plan.priceMonthly)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="mt-1 font-medium">
                      {subscription.cancelAtPeriodEnd
                        ? 'Será cancelada ao fim do período'
                        : 'Renovação automática'}
                    </p>
                  </div>
                </div>
                {isSubscriptionActive && !subscription.cancelAtPeriodEnd && (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={cancelSubscription.isPending}
                    >
                      {cancelSubscription.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelando...
                        </>
                      ) : (
                        'Cancelar Assinatura'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Plans Grid */}
          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando planos...</span>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans
                ?.filter((plan) => plan.active)
                .map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrentPlan={isCurrentPlan(plan.id)}
                    isSubscriptionActive={isSubscriptionActive}
                    onSubscribe={() => handleSubscribe(plan.id)}
                    isLoading={selectedPlanId === plan.id && createCheckout.isPending}
                    getPlanIcon={getPlanIcon}
                    formatPrice={formatPrice}
                  />
                ))}
            </div>
          )}

          {/* Features Comparison */}
          {plans && plans.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Comparação de Recursos</CardTitle>
                <CardDescription>
                  Veja o que cada plano oferece
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">Recurso</th>
                        {plans
                          .filter((plan) => plan.active)
                          .map((plan) => (
                            <th
                              key={plan.id}
                              className="px-4 py-3 text-center text-sm font-medium"
                            >
                              {plan.name}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3 text-sm">Usuários Máximos</td>
                        {plans
                          .filter((plan) => plan.active)
                          .map((plan) => (
                            <td key={plan.id} className="px-4 py-3 text-center text-sm">
                              {plan.maxUsers === -1 ? 'Ilimitado' : plan.maxUsers}
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3 text-sm">Canais Máximos</td>
                        {plans
                          .filter((plan) => plan.active)
                          .map((plan) => (
                            <td key={plan.id} className="px-4 py-3 text-center text-sm">
                              {plan.maxChannels === -1 ? 'Ilimitado' : plan.maxChannels}
                            </td>
                          ))}
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3 text-sm">Conversas Máximas</td>
                        {plans
                          .filter((plan) => plan.active)
                          .map((plan) => (
                            <td key={plan.id} className="px-4 py-3 text-center text-sm">
                              {plan.maxConversations === -1
                                ? 'Ilimitado'
                                : plan.maxConversations}
                            </td>
                          ))}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Preço Mensal</td>
                        {plans
                          .filter((plan) => plan.active)
                          .map((plan) => (
                            <td key={plan.id} className="px-4 py-3 text-center text-sm font-medium">
                              {formatPrice(plan.priceMonthly)}
                            </td>
                          ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

interface PlanCardProps {
  plan: {
    id: string
    name: string
    type: PlanType
    description?: string
    maxUsers: number
    maxChannels: number
    maxConversations: number
    priceMonthly: number
  }
  isCurrentPlan: boolean
  isSubscriptionActive: boolean
  onSubscribe: () => void
  isLoading: boolean
  getPlanIcon: (type: PlanType) => React.ReactNode
  formatPrice: (price: number) => string
}

function PlanCard({
  plan,
  isCurrentPlan,
  isSubscriptionActive,
  onSubscribe,
  isLoading,
  getPlanIcon,
  formatPrice,
}: PlanCardProps) {
  return (
    <Card className={isCurrentPlan ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlanIcon(plan.type)}
            <CardTitle>{plan.name}</CardTitle>
          </div>
          {isCurrentPlan && (
            <Badge variant="default">Plano Atual</Badge>
          )}
        </div>
        {plan.description && (
          <CardDescription>{plan.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(plan.priceMonthly)}</span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
        </div>

        <Separator className="mb-6" />

        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <span className="text-sm">
              {plan.maxUsers === -1 ? 'Usuários ilimitados' : `${plan.maxUsers} usuários`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <span className="text-sm">
              {plan.maxChannels === -1
                ? 'Canais ilimitados'
                : `${plan.maxChannels} canais`}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <span className="text-sm">
              {plan.maxConversations === -1
                ? 'Conversas ilimitadas'
                : `${plan.maxConversations} conversas`}
            </span>
          </li>
        </ul>

        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : 'default'}
          onClick={onSubscribe}
          disabled={isCurrentPlan || (isSubscriptionActive && !isCurrentPlan) || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : isCurrentPlan ? (
            'Plano Atual'
          ) : isSubscriptionActive ? (
            'Já possui assinatura ativa'
          ) : (
            'Assinar Plano'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SubscriptionsContent />
    </Suspense>
  )
}
