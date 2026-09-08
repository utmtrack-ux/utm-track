"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber, formatMetric } from "@/lib/utils";
import { ArrowUpDown, Download } from "lucide-react";

type InsightItem = {
  id: string;
  name: string;
  parentName?: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  conversions: number;
  cpa: number | null;
  revenue: number;
  roas: number | null;
};

export function CampaignsTable({ level = "campaign" }: { level?: "campaign" | "adset" | "ad" }) {
  const [sortField, setSortField] = useState<keyof InsightItem>("spend");
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery<{ data: InsightItem[] }>({
    queryKey: ["meta-insights", level],
    queryFn: async () => {
      const res = await fetch(`/api/meta/insights?level=${level}`);
      if (!res.ok) throw new Error("Erro ao buscar dados");
      return res.json();
    },
  });

  const items = data?.data || [];

  const handleSort = (field: keyof InsightItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const valA = a[sortField] ?? -Infinity;
    const valB = b[sortField] ?? -Infinity;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const headers = ["Nome", "Status", "Gasto", "Impressões", "Cliques", "CTR", "CPC", "CPM", "Conversões", "CPA", "Faturamento", "ROAS"];
    const lines = [headers.join(";")];
    for (const item of sortedItems) {
      lines.push([
        `"${item.name.replace(/"/g, '""')}"`,
        item.status,
        item.spend.toFixed(2),
        item.impressions,
        item.clicks,
        item.ctr !== null ? item.ctr.toFixed(2) : "",
        item.cpc !== null ? item.cpc.toFixed(2) : "",
        item.cpm !== null ? item.cpm.toFixed(2) : "",
        item.conversions,
        item.cpa !== null ? item.cpa.toFixed(2) : "",
        item.revenue.toFixed(2),
        item.roas !== null ? item.roas.toFixed(2) : ""
      ].join(";"));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `meta-${level}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "ACTIVE") {
      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-xs rounded-full font-medium">Ativo</span>;
    }
    if (s === "PAUSED") {
      return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 text-xs rounded-full font-medium">Pausado</span>;
    }
    return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs rounded-full font-medium">{status}</span>;
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white capitalize">
          {level === "campaign" ? "Campanhas" : level === "adset" ? "Conjuntos de Anúncios" : "Anúncios"} ({sortedItems.length})
        </h3>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </button>
      </div>

      <table className="w-full text-xs text-left">
        <thead className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th onClick={() => handleSort("name")} className="px-4 py-3 cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center gap-1">Nome <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            {level !== "campaign" && <th className="px-4 py-3">Pai</th>}
            <th onClick={() => handleSort("spend")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">Gasto <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("impressions")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">Impressões <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("clicks")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">Cliques <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("ctr")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">CTR <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("cpc")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">CPC <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("cpm")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">CPM <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("conversions")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">Conversões <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("cpa")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">CPA <ArrowUpDown className="w-3 h-3" /></div>
            </th>
            <th onClick={() => handleSort("roas")} className="px-3 py-3 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white">
              <div className="flex items-center justify-end gap-1">ROAS <ArrowUpDown className="w-3 h-3" /></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                <td colSpan={11} className="py-3 px-4">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                </td>
              </tr>
            ))
          ) : sortedItems.length === 0 ? (
            <tr>
              <td colSpan={11} className="py-8 text-center text-gray-500 dark:text-gray-400">
                Nenhum dado encontrado para o nível selecionado. Sincronize suas contas.
              </td>
            </tr>
          ) : (
            sortedItems.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white max-w-[200px] truncate" title={item.name}>
                  {item.name}
                </td>
                {level !== "campaign" && (
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate" title={item.parentName}>
                    {item.parentName || "—"}
                  </td>
                )}
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.spend)}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">{formatNumber(item.impressions)}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300 font-mono">{formatNumber(item.clicks)}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{formatMetric(item.ctr, "percent")}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{formatMetric(item.cpc, "currency")}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{formatMetric(item.cpm, "currency")}</td>
                <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white">{item.conversions}</td>
                <td className="px-3 py-3 text-right text-gray-700 dark:text-gray-300">{formatMetric(item.cpa, "currency")}</td>
                <td className="px-3 py-3 text-right font-medium text-blue-600 dark:text-blue-400">{formatMetric(item.roas, "ratio")}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
