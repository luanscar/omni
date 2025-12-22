'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useMySubscription } from '@/lib/api/modules/subscriptions'
import { SubscriptionStatus } from '@/lib/api/types'
import { Sparkles, X } from 'lucide-react'
import { useState, useEffect } from 'react'

export function SubscriptionBanner() {
  const { data: subscription, isLoading, error } = useMySubscription()
  const [dismissed, setDismissed] = useState(false)

  // Persistir estado de dismiss no localStorage
  useEffect(() => {
    const dismissedState = localStorage.getItem('subscription-banner-dismissed')
    if (dismissedState === 'true') {
      setDismissed(true)
    }
  }, [])

  // Limpar estado de dismiss quando houver subscription ativa
  useEffect(() => {
    if (subscription && subscription.status === SubscriptionStatus.ACTIVE) {
      setDismissed(false)
      localStorage.removeItem('subscription-banner-dismissed')
    }
  }, [subscription])

  // Debug em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SubscriptionBanner Debug:', {
        isLoading,
        hasSubscription: !!subscription,
        subscriptionStatus: subscription?.status,
        dismissed,
        error: error?.message,
      })
    }
  }, [isLoading, subscription, dismissed, error])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('subscription-banner-dismissed', 'true')
  }

  // Não mostrar se está carregando
  if (isLoading) {
    return null
  }

  // Não mostrar se foi fechado
  if (dismissed) {
    return null
  }

  // Mostrar apenas se NÃO tiver subscription ou se tiver mas não estiver ativa
  // O banner deve aparecer para incentivar a assinatura quando não há plano ativo
  // Considerar ACTIVE e TRIALING como status válidos (assinatura ativa)
  if (
    subscription &&
    (subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING)
  ) {
    return null
  }

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Upgrade seu plano
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Desbloqueie recursos avançados e aumente seus limites
            </p>
            <Button
              asChild
              size="sm"
              className="mt-2 h-7 text-xs"
              variant="default"
            >
              <Link href="/dashboard/subscriptions">Ver Planos</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Fechar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

