'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart2, 
  BarChart3, 
  LayoutDashboard, 
  AppWindow,
  FileText,
  TrendingUp,
  Link2,
  ShoppingBag,
  Plug,
  GitBranch,
  Percent,
  Receipt,
  Activity,
  Bell,
  User,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { UtmTrackLogo } from '@/components/brand/logo'

const navigation = [
  {
    title: 'PRINCIPAL',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Resumo', href: '/summary', icon: FileText },
      { name: 'Meta Ads', href: '/meta-ads', icon: TrendingUp },
      { name: 'Integrações', href: '/integrations', icon: Plug },
    ],
  },
  {
    title: 'APLICATIVO & AVANÇADO',
    items: [
      { name: 'Aplicativo', href: '/dashboard/app', icon: AppWindow },
      { name: 'Avançado', href: '/dashboard/advanced', icon: BarChart3 },
    ],
  },
  {
    title: 'OPERAÇÃO & ANÁLISE',
    items: [
      { name: 'Vendas', href: '/sales', icon: ShoppingBag },
      { name: 'UTM', href: '/utm', icon: Link2 },
      { name: 'Regras', href: '/rules', icon: GitBranch },
      { name: 'Taxas', href: '/fees', icon: Percent },
      { name: 'Despesas', href: '/expenses', icon: Receipt },
      { name: 'Relatórios', href: '/reports', icon: BarChart2 },
      { name: 'Eventos', href: '/events', icon: Activity },
      { name: 'Notificações', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'CONFIGURAÇÕES',
    items: [
      { name: 'Minha conta', href: '/account', icon: User },
      { name: 'Configurações', href: '/settings', icon: Settings },
      { name: 'Alertas & Push', href: '/settings/notifications', icon: Bell },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-md shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-[#060E1C] border-r border-slate-200 dark:border-[#142C52] transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 overflow-y-auto flex flex-col`}>
        <div className="flex items-center h-16 px-5 border-b border-slate-200 dark:border-[#142C52] shrink-0">
          <Link href="/dashboard" className="transition-opacity hover:opacity-90">
            <UtmTrackLogo size="md" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8">
          {navigation.map((group) => (
            <div key={group.title}>
              <h3 className="px-2 text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-all duration-150 ${
                        isActive
                          ? 'bg-[#0066FF] text-white font-semibold shadow-md shadow-[#0066FF]/25'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0E2547] hover:text-[#0066FF] dark:hover:text-[#00D4FF]'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-[#0066FF] dark:text-slate-400 dark:group-hover:text-[#00D4FF]'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
