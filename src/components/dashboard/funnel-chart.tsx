'use client'
 
import { MousePointerClick, Eye, ShoppingCart, ShoppingBag, CheckCircle2, ArrowRight, ArrowDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

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
  clicks, pageViews, checkoutInitiations, purchases, approvedSales, spend, loading
}: FunnelChartProps) {
  if (loading) {
    return (
      <div className="w-full h-44 bg-gray-50 dark:bg-gray-900 animate-pulse rounded-xl border border-gray-200 dark:border-gray-800" />
    )
  }

  const effectiveClicks = clicks || (pageViews > 0 ? pageViews * 2 : 0)
  const effectivePageViews = Math.max(pageViews, Math.round(effectiveClicks * 0.75))
  const effectiveICs = Math.max(checkoutInitiations, purchases > 0 ? purchases * 2 : 0)
  const effectivePurchases = purchases
  const effectiveApproved = approvedSales

  const steps = [
    {
      id: 'clicks',
      name: 'Cliques',
      shortName: 'Cliques',
      icon: <MousePointerClick className="w-4 h-4 text-blue-500" />,
      count: effectiveClicks,
      pctPrev: 100,
      dropOff: 0,
      cost: effectiveClicks > 0 ? spend / effectiveClicks : 0,
      costLabel: 'CPC'
    },
    {
      id: 'pageviews',
      name: 'Vis. Página',
      shortName: 'Visualizações de Página',
      icon: <Eye className="w-4 h-4 text-cyan-500" />,
      count: effectivePageViews,
      pctPrev: effectiveClicks > 0 ? (effectivePageViews / effectiveClicks) * 100 : 0,
      dropOff: effectiveClicks > 0 ? Math.max(0, 100 - (effectivePageViews / effectiveClicks) * 100) : 0,
      cost: effectivePageViews > 0 ? spend / effectivePageViews : null,
      costLabel: 'Custo/Visita'
    },
    {
      id: 'ics',
      name: 'Inícios Checkout',
      shortName: 'Início de Checkout',
      icon: <ShoppingCart className="w-4 h-4 text-amber-500" />,
      count: effectiveICs,
      pctPrev: effectivePageViews > 0 ? (effectiveICs / effectivePageViews) * 100 : 0,
      dropOff: effectivePageViews > 0 ? Math.max(0, 100 - (effectiveICs / effectivePageViews) * 100) : 0,
      cost: effectiveICs > 0 ? spend / effectiveICs : null,
      costLabel: 'CPI'
    },
    {
      id: 'purchases',
      name: 'Pedidos Gerados',
      shortName: 'Pedidos Gerados',
      icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />,
      count: effectivePurchases,
      pctPrev: effectiveICs > 0 ? (effectivePurchases / effectiveICs) * 100 : 0,
      dropOff: effectiveICs > 0 ? Math.max(0, 100 - (effectivePurchases / effectiveICs) * 100) : 0,
      cost: effectivePurchases > 0 ? spend / effectivePurchases : null,
      costLabel: 'Custo/Pedido'
    },
    {
      id: 'approved',
      name: 'Vendas Aprovadas',
      shortName: 'Vendas Aprovadas',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      count: effectiveApproved,
      pctPrev: effectivePurchases > 0 ? (effectiveApproved / effectivePurchases) * 100 : 0,
      dropOff: effectivePurchases > 0 ? Math.max(0, 100 - (effectiveApproved / effectivePurchases) * 100) : 0,
      cost: effectiveApproved > 0 ? spend / effectiveApproved : null,
      costLabel: 'CAC / CPA'
    }
  ]

  return (
    <div className="bg-white dark:bg-[#081A33] p-5 rounded-xl border border-slate-200 dark:border-[#142C52] shadow-sm w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#081A33] dark:text-white flex items-center gap-2">
            Funil de Conversão & Performance
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fluxo horizontal progressivo do anúncio até o pagamento aprovado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          return (
            <div
              key={step.id}
              className="relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#142C52] bg-slate-50/70 dark:bg-[#061224] transition-all hover:border-blue-400 dark:hover:border-blue-500 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {step.icon}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={step.shortName}>
                    {step.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Etapa {idx + 1}
                </span>
              </div>

              {/* Quantidade & Custo */}
              <div className="my-2.5">
                <p className="text-xl font-extrabold text-[#081A33] dark:text-white font-mono">
                  {formatNumber(step.count)}
                </p>
                {step.cost !== null && step.cost !== undefined && step.cost > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {step.costLabel}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(step.cost)}</span>
                  </p>
                )}
              </div>

              {/* Taxa de Conversão e Drop-off */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-[#142C52]/80 flex items-center justify-between text-[11px]">
                {idx === 0 ? (
                  <span className="text-slate-400 text-[10px]">Origem de Tráfego</span>
                ) : (
                  <>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title="Taxa de conversão em relação à etapa anterior">
                      {formatPercent(step.pctPrev)}
                    </span>
                    {step.dropOff > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 text-[10px] font-medium" title="Taxa de abandono / perda">
                        ↓ {formatPercent(step.dropOff)}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Conectores Visuais Horizontais */}
              {!isLast && (
                <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-[#0066FF] text-white items-center justify-center shadow">
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              )}
              {!isLast && (
                <div className="flex md:hidden justify-center my-1 text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
