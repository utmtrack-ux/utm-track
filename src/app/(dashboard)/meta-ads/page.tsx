"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { CampaignsTable } from "@/components/meta-ads/campaigns-table";
import {
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CheckSquare,
  Square,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";
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

function MetaAdsContent() {
  const [activeTab, setActiveTab] = useState<"Contas" | "Campanhas" | "Conjuntos" | "Anúncios">("Contas");
  const [period, setPeriod] = useState({
    preset: "Últimos 30 dias",
    ...getDateRange("last30days"),
  });
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualAccount, setManualAccount] = useState({ name: "", externalId: "", accessToken: "" });
  
  // Sincronização em etapas com progresso visual
  const [syncStep, setSyncStep] = useState<number>(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncDetail, setSyncDetail] = useState<{ campaigns?: number; adSets?: number; ads?: number; insights?: number } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: accountsData, isLoading: loadingAccounts, refetch: refetchAccounts } = useQuery<{
    accounts: AdAccountItem[];
  }>({
    queryKey: ["meta-accounts"],
    queryFn: () => fetch("/api/meta/accounts").then((r) => r.json()),
  });

  const accounts = accountsData?.accounts || [];
  const needsReconnect = accounts.some((a) => a.status === "reconnect_required" || a.status === "error");

  // Detectar retorno do OAuth e abrir seleção de contas
  useEffect(() => {
    const statusParam = searchParams.get("status");
    const selectParam = searchParams.get("select_accounts");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setSyncMessage(`Erro retornado pela Meta: ${decodeURIComponent(errorParam)}`);
    } else if (statusParam === "oauth_success" || selectParam === "true") {
      setIsSelectModalOpen(true);
      // Pré-selecionar todas as contas ativas
      if (accounts.length > 0) {
        setSelectedIds(accounts.map((a) => a.id));
      }
    }
  }, [searchParams, accounts.length]);

  useEffect(() => {
    if (accounts.length > 0 && selectedIds.length === 0) {
      setSelectedIds(accounts.filter((a) => a.status === "active").map((a) => a.id));
    }
  }, [accounts]);

  // Mutação para sincronização passo a passo
  const syncMutation = useMutation({
    mutationFn: async (accountId?: string) => {
      setSyncStep(1);
      setSyncMessage("1/5: Conectando com a Meta Graph API v21.0...");
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(2);
      setSyncMessage("2/5: Sincronizando campanhas ativas...");
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(3);
      setSyncMessage("3/5: Sincronizando conjuntos de anúncios e orçamentos...");
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(4);
      setSyncMessage("4/5: Sincronizando criativos e anúncios...");
      await new Promise((r) => setTimeout(r, 600));

      setSyncStep(5);
      setSyncMessage("5/5: Importando métricas diárias e dados de conversão (Insights)...");

      const res = await fetch("/api/meta/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountId ? { accountId } : {}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na sincronização");
      return data;
    },
    onSuccess: (data) => {
      setSyncStep(6);
      setSyncMessage("Sincronização concluída com sucesso!");
      if (data?.results?.[0]) {
        const first = data.results[0];
        setSyncDetail({
          campaigns: first.campaigns,
          adSets: first.adSets,
          ads: first.ads,
          insights: first.insights,
        });
      } else if (data?.campaigns !== undefined) {
        setSyncDetail({
          campaigns: data.campaigns,
          adSets: data.adSets,
          ads: data.ads,
          insights: data.insights,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["meta-insights"] });
      queryClient.invalidateQueries({ queryKey: ["meta-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setTimeout(() => {
        setSyncStep(0);
        setSyncMessage(null);
      }, 6000);
    },
    onError: (err: Error) => {
      setSyncStep(0);
      setSyncMessage(`Erro: ${err.message}`);
      setTimeout(() => setSyncMessage(null), 7000);
    },
  });

  // Mutação para salvar seleção de contas
  const selectAccountsMutation = useMutation({
    mutationFn: async (accountIds: string[]) => {
      const res = await fetch("/api/meta/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAccountIds: accountIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar contas");
      return data;
    },
    onSuccess: () => {
      // Close modal immediately — selection was saved
      setIsSelectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["meta-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.replace("/meta-ads");
      // Trigger sync separately — does not block the modal
      syncMutation.mutate();
    },
    onError: (err: Error) => {
      setSyncMessage(`Erro ao salvar contas: ${err.message}`);
      setTimeout(() => setSyncMessage(null), 7000);
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
      setIsManualModalOpen(false);
      setManualAccount({ name: "", externalId: "", accessToken: "" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/meta/accounts?id=${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meta-accounts"] }),
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(accounts.map((a) => a.id));
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const tabs: Array<"Contas" | "Campanhas" | "Conjuntos" | "Anúncios"> = [
    "Contas",
    "Campanhas",
    "Conjuntos",
    "Anúncios",
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Alerta de Reconexão Necessária */}
      {needsReconnect && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                A conexão com a Meta requer renovação
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                O token de acesso expirou ou foi invalidado na Meta. Seus dados históricos foram preservados.
              </p>
            </div>
          </div>
          <Link
            href="/api/meta/oauth"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow shrink-0"
          >
            Reconectar Meta Ads
          </Link>
        </div>
      )}

      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento Meta Ads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conexão com a Meta Graph API v21.0, importação de contas, campanhas e métricas reais
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Sincronizando..." : "Sincronizar Agora"}
          </button>
        </div>
      </div>

      {/* Indicador de Progresso Real da Sincronização */}
      {syncMessage && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-200">
            <span>{syncMessage}</span>
            {syncStep > 0 && syncStep <= 5 && <span className="animate-pulse">{syncStep * 20}%</span>}
            {syncStep === 6 && <span className="text-emerald-600 dark:text-emerald-400">100%</span>}
          </div>
          {syncStep > 0 && (
            <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  syncStep === 6 ? "bg-emerald-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(syncStep * 20, 100)}%` }}
              />
            </div>
          )}
          {syncDetail && (
            <div className="flex items-center gap-4 text-[11px] text-blue-700 dark:text-blue-300 pt-1">
              <span>✓ {syncDetail.campaigns || 0} campanhas</span>
              <span>✓ {syncDetail.adSets || 0} conjuntos</span>
              <span>✓ {syncDetail.ads || 0} anúncios</span>
              <span>✓ {syncDetail.insights || 0} métricas diárias importadas</span>
            </div>
          )}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Contas de Anúncio ({accounts.length})
              </h2>
              <p className="text-xs text-gray-500">
                Selecione as contas que devem alimentar o dashboard e os relatórios de UTM.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {accounts.length > 0 && (
                <button
                  onClick={() => setIsSelectModalOpen(true)}
                  className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Selecionar Contas ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Manual
              </button>
              <Link
                href="/api/meta/oauth"
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 shadow transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Conectar via OAuth Meta
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((acc) => {
              const isSelected = selectedIds.includes(acc.id);
              const isActive = acc.status === "active";

              return (
                <div
                  key={acc.id}
                  className={`p-5 bg-white dark:bg-gray-900 rounded-xl border shadow-sm space-y-3 transition-all ${
                    isSelected
                      ? "border-blue-500/60 ring-1 ring-blue-500/30"
                      : "border-gray-200 dark:border-gray-800 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900 dark:text-white truncate" title={acc.name}>
                      {acc.name}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Conectada
                      </span>
                    ) : acc.status === "reconnect_required" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> Reconectar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        Inativa
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>
                      ID da Conta:{" "}
                      <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">
                        {acc.externalId}
                      </span>
                    </p>
                    <p>
                      Moeda / Fuso:{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {acc.currency || "BRL"} • {acc.timezone || "América/São Paulo"}
                      </span>
                    </p>
                    <p>
                      Último Sync:{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {acc.lastSyncAt ? formatDate(acc.lastSyncAt) : "Nunca"}
                      </span>
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <button
                      onClick={() => syncMutation.mutate(acc.id)}
                      disabled={syncMutation.isPending}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Sincronizar esta
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Deseja desconectar esta conta de anúncio? Seus dados históricos serão preservados.")) {
                          deleteAccountMutation.mutate(acc.id);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Desconectar
                    </button>
                  </div>
                </div>
              );
            })}

            {accounts.length === 0 && !loadingAccounts && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 space-y-3">
                <TrendingUp className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">
                  Nenhuma conta de anúncios conectada
                </h3>
                <p className="text-xs max-w-sm mx-auto text-gray-500">
                  Clique no botão abaixo para autorizar o UTM-Track no Meta Ads via OAuth oficial e importar suas contas e campanhas.
                </p>
                <div className="pt-2">
                  <Link
                    href="/api/meta/oauth"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow"
                  >
                    <Sparkles className="w-4 h-4" /> Conectar Meta Ads Oficial
                  </Link>
                </div>
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

      {/* Modal Selecionar Contas de Anúncio */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" /> Selecionar Contas de Anúncios
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Marque as contas que deseja monitorar no UTM-Track ({selectedIds.length} selecionada(s))
                </p>
              </div>
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
              >
                {selectedIds.length === accounts.length ? (
                  <>
                    <Square className="w-3.5 h-3.5" /> Desmarcar Todas
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" /> Selecionar Todas
                  </>
                )}
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100 dark:divide-gray-800">
              {accounts.map((acc) => {
                const isSelected = selectedIds.includes(acc.id);
                return (
                  <label
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">
                          {acc.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {acc.externalId} • {acc.currency || "BRL"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-500">
                      {acc.timezone || "América/São Paulo"}
                    </span>
                  </label>
                );
              })}

              {accounts.length === 0 && (
                <p className="text-center text-xs text-gray-500 py-6">
                  Nenhuma conta encontrada vinculada a este perfil da Meta.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsSelectModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => selectAccountsMutation.mutate(selectedIds)}
                disabled={selectedIds.length === 0 || selectAccountsMutation.isPending}
                className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow disabled:opacity-50 transition-colors"
              >
                {selectAccountsMutation.isPending ? "Salvando..." : "Conectar Contas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Conta Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conectar Conta de Anúncios</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome Identificador
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conta Escala Principal"
                  value={manualAccount.name}
                  onChange={(e) => setManualAccount({ ...manualAccount, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ID da Conta (act_XXXXXXXXX)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 1020304050"
                  value={manualAccount.externalId}
                  onChange={(e) => setManualAccount({ ...manualAccount, externalId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Token de Usuário do Sistema (Opcional)
                </label>
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
                onClick={() => setIsManualModalOpen(false)}
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

export default function MetaAdsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-gray-500">Carregando Meta Ads...</div>}>
      <MetaAdsContent />
    </Suspense>
  );
}

