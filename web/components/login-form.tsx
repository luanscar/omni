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
import { useLogin } from '@/lib/api/modules/auth'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const login = useLogin()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await login.mutateAsync({
        email,
        password,
      })

      if (response.access_token) {
        // Redirecionar após login bem-sucedido
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      let errorMessage = 'Credenciais inválidas. Tente novamente.'
      
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

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Entrar na sua conta</CardTitle>
          <CardDescription>
            Digite seu email e senha para fazer login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={login.isPending}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={login.isPending}
                />
              </Field>
              {error && (
                <Field>
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                </Field>
              )}
              <Field>
                <Button type="submit" disabled={login.isPending} className="w-full">
                  {login.isPending ? 'Entrando...' : 'Entrar'}
                </Button>
                <FieldDescription className="text-center">
                  Não tem uma conta?{' '}
                  <a
                    href="/signup"
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    Criar conta
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
