import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  Users,
  Rocket,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4" variant="secondary">
            Plataforma de Atendimento Multi-canal
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Gerencie todas as suas{" "}
            <span className="text-primary">conversas</span> em um só lugar
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Conecte WhatsApp, Instagram, Telegram e WebChat. Atenda seus
            clientes de forma eficiente com nossa plataforma completa de
            atendimento.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/login">
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="#features">Saiba mais</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Por que escolher nossa plataforma?
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Tudo que você precisa para gerenciar seu atendimento
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multi-canal</CardTitle>
                <CardDescription>
                  Atenda via WhatsApp, Instagram, Telegram e WebChat em uma
                  única plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">WhatsApp integrado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Instagram Direct</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Telegram e WebChat</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gestão de Equipes</CardTitle>
                <CardDescription>
                  Organize sua equipe e distribua conversas de forma eficiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Equipes personalizadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Transferência de conversas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Chat interno</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mensagens Ricas</CardTitle>
                <CardDescription>
                  Envie textos, imagens, vídeos, áudios e documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Múltiplos tipos de mídia</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Respostas e encaminhamento</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Reações e localização</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Auditoria Completa</CardTitle>
                <CardDescription>
                  Rastreie todas as ações e mantenha histórico completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Logs detalhados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Estatísticas em tempo real</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Rastreamento de IP</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Proteção de nível empresarial para seus dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Autenticação JWT</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Multi-tenancy isolado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Controle de permissões</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Escalável</CardTitle>
                <CardDescription>
                  Cresça sem limites com nossa infraestrutura robusta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">API RESTful completa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Webhooks e integrações</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">Suporte 24/7</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              O que nossos clientes dizem
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Empresas que confiam em nossa plataforma
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>
                  &quot;A melhor decisão que tomamos. A plataforma transformou
                  completamente nosso atendimento ao cliente.&quot;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Maria Silva</div>
                <div className="text-sm text-muted-foreground">
                  CEO, TechStart
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>
                  &quot;Incrível facilidade de uso e suporte excepcional. Recomendo
                  para qualquer empresa que precisa de atendimento eficiente.&quot;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">João Santos</div>
                <div className="text-sm text-muted-foreground">
                  CTO, Inovação Digital
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>
                  &quot;ROI impressionante desde o primeiro mês. A plataforma paga
                  por si mesma com o aumento de produtividade.&quot;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="font-semibold">Ana Costa</div>
                <div className="text-sm text-muted-foreground">
                  Diretora, Growth Co
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator />

      {/* Pricing Section */}
      <PricingSection />

      <Separator />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="mx-auto max-w-4xl border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl sm:text-4xl">
              Pronto para começar?
            </CardTitle>
            <CardDescription className="text-lg">
              Junte-se a milhares de empresas que já estão usando nossa
              plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/signup">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="#features">Agendar demonstração</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="mb-4 font-semibold">Produto</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:underline">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:underline">
                    Preços
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:underline">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Sobre
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Carreiras
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Suporte</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:underline">
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Termos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            © 2024 Omni SaaS. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
