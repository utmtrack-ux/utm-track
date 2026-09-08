"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, ShoppingBag, Percent, RefreshCw, BarChart2 } from "lucide-react";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { getDateRange, formatCurrency, formatMetric, formatPercent } from "@/lib/utils";

export default function SummaryPage() {
  const [period, setPeriod] = useState({
    preset: "Últimos 30 dias",
    ...getDateRange("last30days"),
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["summary-consolidated", period.from.toISOString(), period.to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/summary?from=${period.from.toISOString()}&to=${period.to.toISOString()}`
      );
      if (!res.ok) throw new Error("Erro ao buscar resumo");
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resumo Consolidado</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visão unificada cruzando Meta Ads, plataformas de checkout (Hotmart, Yampi, Shopify, Cacto) e despesas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            value={period.preset}
            onChange={(preset, from, to) => setPeriod({ preset, from, to, label: preset })}
          />
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-blue-600" : "text-gray-500"}`} />
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Faturamento Bruto</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {isLoading ? "..." : formatCurrency(data?.grossRevenue || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Líquido: {formatCurrency(data?.netRevenue || 0)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Investimento em Anúncios</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {isLoading ? "..." : formatCurrency(data?.totalSpend || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{data?.totalClicks || 0} cliques registrados</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Lucro Líquido Real</p>
            <p className={`text-2xl font-bold mt-1 ${(data?.profit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {isLoading ? "..." : formatCurrency(data?.profit || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Margem: {formatMetric(data?.margin, "percent")}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">ROAS Consolidado</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatMetric(data?.roas, "ratio")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">ROI Total</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {formatMetric(data?.roi, "percent")}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">Ticket Médio</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(data?.ticketMedio || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500">Taxa de Aprovação</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatPercent(data?.taxaAprovacao || 0)}
          </p>
        </div>
      </div>

      {/* Platform Distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendas por Plataforma de Checkout</h2>
          </div>
          <span className="text-xs text-gray-500">{data?.totalSales || 0} pedidos no total</span>
        </div>

        {(!data?.platformDistribution || data.platformDistribution.length === 0) ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            Nenhuma venda registrada no período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.platformDistribution.map((item: { platform: string; count: number; revenue: number; percentage: number }) => (
              <div
                key={item.platform}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-600" /> {item.platform}
                  </span>
                  <span className="text-xs text-blue-600 font-semibold">{item.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{item.count} vendas</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
