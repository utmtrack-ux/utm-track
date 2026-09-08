'use client'

import { formatCurrency, formatNumber } from '@/lib/utils'

type FunnelChartProps = {
  impressions: number
  clicks: number
  pageViews: number
  checkoutInitiations: number
  purchases: number
  approvedSales: number
  spend: number
  loading?: boolean
}

export function FunnelChart({
  impressions, clicks, pageViews, checkoutInitiations, purchases, approvedSales, spend, loading
}: FunnelChartProps) {
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-50 dark:bg-gray-900 animate-pulse rounded-xl border border-gray-200 dark:border-gray-800" />
    )
  }

  const steps = [
    { label: 'Impressões', value: impressions, cost: spend / (impressions || 1) * 1000, costLabel: 'CPM' },
    { label: 'Cliques', value: clicks, cost: spend / (clicks || 1), costLabel: 'CPC' },
    { label: 'Visualizações', value: pageViews, cost: spend / (pageViews || 1), costLabel: 'CPA (Visita)' },
    { label: 'Checkouts', value: checkoutInitiations, cost: spend / (checkoutInitiations || 1), costLabel: 'CPI' },
    { label: 'Compras', value: purchases, cost: spend / (purchases || 1), costLabel: 'CPA' },
    { label: 'Aprovadas', value: approvedSales, cost: spend / (approvedSales || 1), costLabel: 'CAC' }
  ]

  const maxVal = steps[0].value || 1

  return (
    <div className="bg-white dark:bg-[#081A33] p-6 rounded-xl border border-slate-200 dark:border-[#142C52] shadow-sm w-full">
      <h3 className="text-lg font-bold text-[#081A33] dark:text-white mb-6">Funil de Vendas</h3>
      <div className="flex flex-col items-center space-y-2">
        {steps.map((step, i) => {
          const percentage = (step.value / maxVal) * 100
          const width = Math.max(percentage, 10) // min 10% width
          const prevValue = i > 0 ? steps[i - 1].value : null
          const dropRate = prevValue ? ((1 - (step.value / prevValue)) * 100).toFixed(1) : 0

          return (
            <div key={step.label} className="w-full flex flex-col items-center">
              {i > 0 && prevValue !== null && prevValue !== 0 && step.value < prevValue && (
                <div className="z-10 -my-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold px-2 py-0.5 rounded-full border border-white dark:border-[#081A33] shadow-sm">
                  -{dropRate}%
                </div>
              )}
              <div 
                className="relative bg-gradient-to-r from-[#0066FF] to-[#0052CC] dark:from-[#0066FF] dark:to-[#00D4FF]/90 rounded-lg flex items-center justify-between px-4 py-3 text-white shadow-md transition-all duration-300"
                style={{ width: `${width}%`, minWidth: '220px' }}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold opacity-90">{step.label}</span>
                  <span className="text-xl font-black">{formatNumber(step.value)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-semibold opacity-85">{step.costLabel}</span>
                  <span className="text-sm font-bold">{formatCurrency(step.cost)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
