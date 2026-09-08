"use client";

import React from "react";
import { MousePointerClick, Eye, ShoppingCart, ShoppingBag, CheckCircle2, ArrowRight, ArrowDown } from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface FunnelStepData {
  count: number;
  pctPrev?: number;
  pctTotal?: number;
  dropOff?: number;
  cost?: number | null;
}

interface ConversionFunnelProps {
  data?: {
    clicks: FunnelStepData;
    pageViews: FunnelStepData;
    ics: FunnelStepData;
    vendasIniciadas: FunnelStepData;
    vendasAprovadas: FunnelStepData;
  };
  loading?: boolean;
}

export function ConversionFunnel({ data, loading = false }: ConversionFunnelProps) {
  const steps = [
    {
      id: "clicks",
      name: "Cliques",
      shortName: "Cliques",
      icon: <MousePointerClick className="w-4 h-4 text-blue-500" />,
      data: data?.clicks || { count: 0, pctPrev: 100, pctTotal: 100, cost: 0 },
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
      costLabel: "CPC",
      taperWidth: "w-full",
    },
    {
      id: "pageviews",
      name: "Vis. Página",
      shortName: "Vis. Página",
      icon: <Eye className="w-4 h-4 text-cyan-500" />,
      data: data?.pageViews || { count: 0, pctPrev: 0, pctTotal: 0, dropOff: 0, cost: null },
      badgeColor: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
      costLabel: "Custo/Visita",
      taperWidth: "w-[85%]",
    },
    {
      id: "ics",
      name: "ICs",
      shortName: "Início de Checkout",
      icon: <ShoppingCart className="w-4 h-4 text-amber-500" />,
      data: data?.ics || { count: 0, pctPrev: 0, pctTotal: 0, dropOff: 0, cost: null },
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      costLabel: "CPI",
      taperWidth: "w-[70%]",
    },
    {
      id: "vendas_inic",
      name: "Vendas Inic.",
      shortName: "Vendas Iniciadas",
      icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />,
      data: data?.vendasIniciadas || { count: 0, pctPrev: 0, pctTotal: 0, dropOff: 0, cost: null },
      badgeColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
      costLabel: "Custo/Pedido",
      taperWidth: "w-[55%]",
    },
    {
      id: "vendas_apr",
      name: "Vendas Apr.",
      shortName: "Vendas Aprovadas",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      data: data?.vendasAprovadas || { count: 0, pctPrev: 0, pctTotal: 0, dropOff: 0, cost: null },
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      costLabel: "CPA",
      taperWidth: "w-[40%]",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#081A33] border border-slate-200/90 dark:border-[#142C52] rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Funil de Conversão <span className="text-xs font-normal text-slate-400 dark:text-slate-400">(Meta Ads & Tráfego)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fluxo contínuo desde o clique no anúncio até a aprovação do pedido
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 py-6 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const dropOff = step.data.dropOff;
            const convPrev = step.data.pctPrev;

            return (
              <div key={step.id} className="relative flex flex-col justify-between p-3.5 rounded-xl border border-slate-200 dark:border-[#142C52] bg-slate-50/70 dark:bg-[#061224] transition-all hover:border-blue-400 dark:hover:border-blue-500">
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

                {/* Quantidade */}
                <div className="my-2.5">
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatNumber(step.data.count || 0)}
                  </p>
                  {step.data.cost !== null && step.data.cost !== undefined && step.data.cost > 0 && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.costLabel}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(step.data.cost)}</span>
                    </p>
                  )}
                </div>

                {/* Métricas de conversão e queda */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-[#142C52]/80 flex items-center justify-between text-[11px]">
                  {idx === 0 ? (
                    <span className="text-slate-400 text-[10px]">Origem / Topo</span>
                  ) : (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold" title="Taxa em relação à etapa anterior">
                        {formatPercent(convPrev || 0)}
                      </span>
                      {dropOff !== undefined && dropOff > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 text-[10px] font-medium" title="Taxa de abandono">
                          ↓ {formatPercent(dropOff)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Indicador de fluxo visual horizontal */}
                {!isLast && (
                  <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-blue-600 text-white items-center justify-center shadow">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                )}
                {!isLast && (
                  <div className="flex md:hidden justify-center my-1 text-slate-400">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
