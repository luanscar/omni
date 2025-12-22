'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePlans } from "@/lib/api/modules/plans";

export function PricingSection() {
  const { data: plans, isLoading } = usePlans();

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Planos e Preços
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          <div className="text-center">Carregando planos...</div>
        </div>
      </section>
    );
  }

  if (!plans || plans.length === 0) {
    return null;
  }

  return (
    <section id="pricing" className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Planos e Preços
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative">
              {plan.type === "MEDIUM" && (
                <Badge className="absolute right-4 top-4" variant="secondary">
                  Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    R$ {(plan.priceMonthly / 100).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      Até {plan.maxUsers} usuários
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      Até {plan.maxChannels} canais
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">
                      {plan.maxConversations} conversas/mês
                    </span>
                  </li>
                </ul>
                <Button asChild className="mt-6 w-full" size="lg">
                  <Link href="/login">Começar agora</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

