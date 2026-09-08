'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { PeriodSelector } from './period-selector'
import { MetricsGrid } from './metrics-grid'
import { RevenueChart } from './revenue-chart'
import { FunnelChart } from './funnel-chart'
import { getDateRange } from '@/lib/utils'

export function DashboardContent() {
  const [period, setPeriod] = useState({
    preset: 'Últimos 7 dias',
    ...getDateRange('Últimos 7 dias')
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', period.from.toISOString(), period.to.toISOString()],
    queryFn: async () => {
      const res = await axios.get('/api/dashboard/metrics', {
        params: { from: period.from.toISOString(), to: period.to.toISOString() }
      })
      return res.data
    }
  })

  if (error) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Erro ao carregar dados</h2>
        <p className="text-gray-500 mt-2">Por favor, tente novamente mais tarde.</p>
      </div>
    )
  }

  const isEmpty = !isLoading && data && data.adSpend === 0 && data.sales === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-[#081A33] dark:text-white tracking-tight">Dashboard Geral</h1>
        <PeriodSelector 
          value={period.preset}
          onChange={(preset, from, to) => setPeriod({ preset, from, to, label: preset })}
        />
      </div>

      {isEmpty ? (
        <div className="p-12 text-center bg-white dark:bg-[#081A33] rounded-xl border border-slate-200 dark:border-[#142C52] shadow-sm">
          <h2 className="text-xl font-bold text-[#081A33] dark:text-white mb-2">Nenhum dado encontrado</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Conecte uma conta de anúncio para começar a visualizar suas métricas.</p>
          <Link 
            href="/meta-ads" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-md text-white bg-[#0066FF] hover:bg-[#0052CC] transition-colors"
          >
            Conectar Meta Ads
          </Link>
        </div>
      ) : (
        <>
          <MetricsGrid data={data} loading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={data?.chartData || []} loading={isLoading} />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-[#081A33] p-6 rounded-xl border border-slate-200 dark:border-[#142C52] shadow-sm h-full">
                <h3 className="text-lg font-bold text-[#081A33] dark:text-white mb-4">Resumo da Operação</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#142C52] pb-2.5">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Investimento Total</span>
                    <span className="font-bold text-[#081A33] dark:text-white">{data ? `R$ ${(data.adSpend).toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#142C52] pb-2.5">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Custo por Venda (CPA)</span>
                    <span className="font-bold text-[#081A33] dark:text-white">{data?.cpa ? `R$ ${data.cpa.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-[#142C52] pb-2.5">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Retorno (ROAS)</span>
                    <span className="font-bold text-[#0066FF] dark:text-[#00D4FF]">{data?.roas ? `${data.roas.toFixed(2)}x` : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Lucro Líquido Real</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{data ? `R$ ${data.profit.toFixed(2)}` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <FunnelChart 
            impressions={data?.impressions || 0}
            clicks={data?.clicks || 0}
            pageViews={data?.clicks || 0} // Simplification for demo
            checkoutInitiations={Math.floor((data?.sales || 0) * 1.5)} // Simplification
            purchases={data?.sales || 0}
            approvedSales={data?.approvedSales || 0}
            spend={data?.adSpend || 0}
            loading={isLoading}
          />
        </>
      )}
    </div>
  )
}
