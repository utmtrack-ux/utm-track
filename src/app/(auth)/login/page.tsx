'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { UtmTrackLogo } from '@/components/brand/logo'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const errParam = searchParams.get('error')
    if (errParam) {
      if (errParam === 'USER_SUSPENDED') {
        setError('Acesso temporariamente bloqueado. Entre em contato com o administrador do sistema.')
      } else if (errParam === 'CredentialsSignin') {
        setError('E-mail ou senha incorretos.')
      } else if (errParam === 'Configuration') {
        setError('Erro de configuração no servidor de autenticação.')
      } else if (errParam === 'AccessDenied') {
        setError('Acesso negado. Sua conta não possui permissão.')
      } else {
        setError(`Erro na autenticação: ${errParam}`)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanEmail = email.trim().toLowerCase()

    try {
      const res = await signIn('credentials', {
        email: cleanEmail,
        password,
        redirect: false,
      })

      if (res?.error) {
        if (res.error.includes('USER_SUSPENDED')) {
          setError('Acesso temporariamente bloqueado. Entre em contato com o administrador do sistema.')
        } else if (res.error === 'CredentialsSignin' || res.code === 'credentials') {
          setError('E-mail ou senha incorretos.')
        } else if (res.error === 'Configuration') {
          setError('Erro de configuração de autenticação no servidor.')
        } else {
          setError('Não foi possível entrar. Verifique suas credenciais de acesso.')
        }
      } else if (res?.ok) {
        // Redireciona com window.location para forçar a inicialização limpa da sessão
        window.location.href = '/dashboard'
      } else {
        setError('E-mail ou senha incorretos.')
      }
    } catch (err: unknown) {
      console.error('[login error]', err)
      setError('Ocorreu um erro ao conectar com o servidor. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="flex flex-col items-center text-center">
        <UtmTrackLogo size="lg" showTagline />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Entre na sua conta para continuar</p>
      </div>

      <div className="bg-white dark:bg-[#081A33] rounded-2xl shadow-xl border border-slate-200 dark:border-[#142C52] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#142C52] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] sm:text-sm bg-slate-50 dark:bg-[#061326] text-slate-900 dark:text-white"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 dark:border-[#142C52] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] sm:text-sm bg-slate-50 dark:bg-[#061326] text-slate-900 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#0066FF] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066FF] disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#142C52]/60 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Sistema privado com acesso restrito a clientes autorizados.</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}

