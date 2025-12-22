'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCreateTenant } from '@/lib/api/modules/tenants'
import { useCreateUser } from '@/lib/api/modules/users'
import { useLogin } from '@/lib/api/modules/auth'

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companySlug, setCompanySlug] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createTenant = useCreateTenant()
  const createUser = useCreateUser()
  const login = useLogin()

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value)
    setCompanySlug(generateSlug(value))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (!companySlug) {
      setError('O slug da empresa é obrigatório')
      return
    }

    try {
      // 1. Criar Tenant (Empresa)
      const tenant = await createTenant.mutateAsync({
        name: companyName,
        slug: companySlug,
      })

      // 2. Criar Usuário vinculado ao Tenant
      await createUser.mutateAsync({
        name,
        email,
        password,
        tenantId: tenant.id,
      })

      // 3. Fazer login automaticamente
      const loginResponse = await login.mutateAsync({
        email,
        password,
      })

      if (loginResponse.access_token) {
        // Redirecionar após registro e login bem-sucedidos
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      let errorMessage = 'Erro ao criar conta. Tente novamente.'
      
      if (err instanceof Error) {
        // Se for um erro do Axios, pegar a mensagem da resposta
        if ('response' in err && err.response) {
          const axiosError = err as { response?: { data?: { message?: string } } }
          errorMessage = axiosError.response?.data?.message || errorMessage
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    }
  }

  const isLoading =
    createTenant.isPending || createUser.isPending || login.isPending

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <FieldDescription>
                  Mínimo de 6 caracteres
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirmar senha
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="companyName">Nome da empresa</FieldLabel>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Minha Empresa"
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="companySlug">Slug da empresa</FieldLabel>
                <Input
                  id="companySlug"
                  type="text"
                  placeholder="minha-empresa"
                  value={companySlug}
                  onChange={(e) => setCompanySlug(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <FieldDescription>
                  Identificador único da sua empresa (será gerado
                  automaticamente)
                </FieldDescription>
              </Field>
              {error && (
                <Field>
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                </Field>
              )}
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Criando conta...' : 'Criar conta'}
                </Button>
                <FieldDescription className="text-center">
                  Já tem uma conta?{' '}
                  <a
                    href="/login"
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    Fazer login
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

