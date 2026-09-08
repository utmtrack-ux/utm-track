'use client'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/theme-provider'
import { Moon, Sun, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { UtmTrackLogo } from '@/components/brand/logo'

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // format title
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Dashboard'
    
    // Capitalize last segment
    const last = segments[segments.length - 1]
    return last.charAt(0).toUpperCase() + last.slice(1).replace('-', ' ')
  }

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-[#060E1C] border-b border-slate-200 dark:border-[#142C52] flex items-center justify-between shrink-0">
      <div className="flex items-center">
        {/* Mobile brand mark */}
        <div className="md:hidden flex items-center pl-10">
          <UtmTrackLogo size="sm" />
        </div>
        
        {/* Desktop title */}
        <h1 className="text-xl font-bold text-[#081A33] dark:text-white hidden md:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#0E2547] transition-colors"
          title="Alternar tema"
          aria-label="Alternar tema claro/escuro"
        >
          {mounted && theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
        </button>

        <a 
          href="/notifications" 
          className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#0E2547] transition-colors"
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
        </a>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 md:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0E2547] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#00D4FF] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left text-sm">
              <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">{session?.user?.name || 'Usuário'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#081A33] rounded-xl shadow-xl py-1 ring-1 ring-black/5 border border-slate-200 dark:border-[#142C52] z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-[#142C52] md:hidden">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{session?.user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session?.user?.email}</p>
              </div>
              <a
                href="/account"
                className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0E2547]"
              >
                Minha Conta
              </a>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
