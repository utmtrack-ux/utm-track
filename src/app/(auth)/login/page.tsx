'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { UtmTrackLogo } from '@/components/brand/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('E-mail ou senha incorretos.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login.')
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
            <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
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

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Não tem uma conta?{' '}
          <Link href="/register" className="font-semibold text-[#0066FF] hover:text-[#0052CC] dark:text-[#00D4FF] dark:hover:text-[#39E6FF]">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
