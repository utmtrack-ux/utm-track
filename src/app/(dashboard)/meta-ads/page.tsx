"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { CampaignsTable } from "@/components/meta-ads/campaigns-table";
import { RefreshCw, Plus, Trash2, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { getDateRange, formatDate } from "@/lib/utils";

type AdAccountItem = {
  id: string;
  name: string;
  externalId: string;
  status: string;
  currency: string;
  timezone: string;
  lastSyncAt: string | null;
};

export default function MetaAdsPage() {
  const [activeTab, setActiveTab] = useState<"Contas" | "Campanhas" | "Conjuntos" | "Anúncios">("Contas");
  const [period, setPeriod] = useState({
    preset: "Últimos 30 dias",
    ...getDateRange("last30days"),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualAccount, setManualAccount] = useState({ name: "", externalId: "", accessToken: "" });
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: loadingAccounts, refetch: refetchAccounts } = useQuery<{
    accounts: AdAccountItem[];
  }>({
    queryKey: ["meta-accounts"],
    queryFn: () => fetch("/api/meta/accounts").then((r) => r.json()),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncStatus("Sincronizando contas e métricas...");
      const res = await fetch("/api/meta/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na sincronização");
      return data;
    },
    onSuccess: () => {
      setSyncStatus("Sincronização concluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["meta-insights"] });
      queryClient.invalidateQueries({ queryKey: ["meta-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setTimeout(() => setSyncStatus(null), 4000);
    },
    onError: (err: Error) => {
      setSyncStatus(`Erro: ${err.message}`);
      setTimeout(() => setSyncStatus(null), 5000);
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (body: typeof manualAccount) => {
      const res = await fetch("/api/meta/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao adicionar conta");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meta-accounts"] });
      setIsModalOpen(false);
      setManualAccount({ name: "", externalId: "", accessToken: "" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/meta/accounts?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meta-accounts"] }),
  });

  const accounts = accountsData?.accounts || [];
  const tabs: Array<"Contas" | "Campanhas" | "Conjuntos" | "Anúncios"> = ["Contas", "Campanhas", "Conjuntos", "Anúncios"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento Meta Ads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Contas conectadas, hierarquia de campanhas e sincronização com a Meta Graph API v21.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            value={period.preset}
            onChange={(preset, from, to) => setPeriod({ preset, from, to, label: preset })}
          />
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-lg text-xs font-medium">
          {syncStatus}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-6 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300"
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* 1. Tab Contas */}
      {activeTab === "Contas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Contas de Anúncio ({accounts.length})</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Manual
              </button>
              <Link
                href="/api/meta/oauth"
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Conectar via OAuth
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate" title={acc.name}>
                    {acc.name}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Ativa
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>ID da Conta: <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">{acc.externalId}</span></p>
                  <p>Moeda / Fuso: <span className="text-gray-700 dark:text-gray-300">{acc.currency || "BRL"} • {acc.timezone || "América/São Paulo"}</span></p>
                  <p>Último Sync: <span className="text-gray-700 dark:text-gray-300">{acc.lastSyncAt ? formatDate(acc.lastSyncAt) : "Nunca"}</span></p>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                  <button
                    onClick={() => {
                      if (confirm("Deseja desconectar esta conta de anúncio?")) deleteAccountMutation.mutate(acc.id);
                    }}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Desconectar
                  </button>
                </div>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500">
                <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="font-medium">Nenhuma conta de anúncio conectada</p>
                <p className="text-xs mt-1">Conecte via OAuth ou insira o ID da conta manualmente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Tab Campanhas */}
      {activeTab === "Campanhas" && <CampaignsTable level="campaign" />}

      {/* 3. Tab Conjuntos */}
      {activeTab === "Conjuntos" && <CampaignsTable level="adset" />}

      {/* 4. Tab Anúncios */}
      {activeTab === "Anúncios" && <CampaignsTable level="ad" />}

      {/* Modal Adicionar Conta Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conectar Conta de Anúncios</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Identificador</label>
                <input
                  type="text"
                  placeholder="Ex: Conta Escala Principal"
                  value={manualAccount.name}
                  onChange={(e) => setManualAccount({ ...manualAccount, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ID da Conta (act_XXXXXXXXX)</label>
                <input
                  type="text"
                  placeholder="Ex: 1020304050"
                  value={manualAccount.externalId}
                  onChange={(e) => setManualAccount({ ...manualAccount, externalId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Access Token de Usuário do Sistema (Opcional)</label>
                <input
                  type="password"
                  placeholder="EAAB..."
                  value={manualAccount.accessToken}
                  onChange={(e) => setManualAccount({ ...manualAccount, accessToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">Criptografado com AES-256-GCM em repouso.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => addAccountMutation.mutate(manualAccount)}
                disabled={!manualAccount.name || !manualAccount.externalId}
                className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                Salvar Conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
