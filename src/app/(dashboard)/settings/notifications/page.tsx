"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  ArrowLeft,
  Check
} from "lucide-react";
import { UtmTrackSymbol } from "@/components/brand/symbol";
import { playNotificationSound, setSoundEnabled, setVibrationEnabled, SoundType } from "@/lib/sound";

type Preferences = {
  salesApproved: boolean;
  salesPending: boolean;
  pixGenerated: boolean;
  refunds: boolean;
  chargebacks: boolean;
  systemAlerts: boolean;
  integrationErrors: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
};

export default function NotificationSettingsPage() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState(false);

  const { data, isLoading } = useQuery<{ preferences: Preferences }>({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences");
      if (!res.ok) throw new Error("Erro ao carregar preferências");
      return res.json();
    },
  });

  const [prefs, setPrefs] = useState<Preferences>({
    salesApproved: true,
    salesPending: true,
    pixGenerated: true,
    refunds: true,
    chargebacks: true,
    systemAlerts: true,
    integrationErrors: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    if (data?.preferences) {
      setPrefs(data.preferences);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updated: Preferences) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: (resData) => {
      if (resData.preferences) {
        setPrefs(resData.preferences);
        setSoundEnabled(resData.preferences.soundEnabled);
        setVibrationEnabled(resData.preferences.vibrationEnabled);
      }
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    },
  });

  const handleToggle = (key: keyof Preferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    if (key === "soundEnabled") setSoundEnabled(updated.soundEnabled);
    if (key === "vibrationEnabled") setVibrationEnabled(updated.vibrationEnabled);
    updateMutation.mutate(updated);
  };

  const handleTest = async (type: SoundType) => {
    await playNotificationSound(type);
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link 
              href="/settings" 
              className="p-1.5 rounded-lg border border-slate-200 dark:border-[#142C52] text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <UtmTrackSymbol size={28} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configurações de Notificações
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie quais alertas você deseja receber, habilite canais de som oficiais e resposta de vibração
          </p>
        </div>

        {successMsg && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
            <Check className="w-4 h-4" /> Preferências salvas!
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 bg-slate-100 dark:bg-[#081A33] rounded-2xl animate-pulse" />
          <div className="h-40 bg-slate-100 dark:bg-[#081A33] rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seção 1: Eventos de Venda e Financeiro */}
          <div className="bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#142C52] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#0066FF]/10 text-[#0066FF]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Eventos de Vendas & Pagamentos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Notificações em tempo real com disparo de som característico
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#142C52]/60">
              {/* Venda Aprovada */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="salesApproved" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    💰 Venda aprovada
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      som_venda_aprovada
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Disparado imediatamente quando uma compra tem pagamento confirmado
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest("som_venda_aprovada")}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#142C52] hover:bg-slate-50 dark:hover:bg-[#0E2547] text-slate-700 dark:text-slate-300 transition"
                  >
                    Ouvir
                  </button>
                  <input
                    id="salesApproved"
                    type="checkbox"
                    checked={prefs.salesApproved}
                    onChange={() => handleToggle("salesApproved")}
                    className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                  />
                </div>
              </div>

              {/* Pix Gerado */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="pixGenerated" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    ⚡ Pix gerado
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                      som_pix_gerado
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aviso instantâneo de Pix gerado aguardando liquidação no checkout
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest("som_pix_gerado")}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#142C52] hover:bg-slate-50 dark:hover:bg-[#0E2547] text-slate-700 dark:text-slate-300 transition"
                  >
                    Ouvir
                  </button>
                  <input
                    id="pixGenerated"
                    type="checkbox"
                    checked={prefs.pixGenerated}
                    onChange={() => handleToggle("pixGenerated")}
                    className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                  />
                </div>
              </div>

              {/* Venda Pendente */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="salesPending" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    ⏳ Venda pendente
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      som_venda_pendente
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Boletos bancários e transações pendentes de autorização da operadora
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest("som_venda_pendente")}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#142C52] hover:bg-slate-50 dark:hover:bg-[#0E2547] text-slate-700 dark:text-slate-300 transition"
                  >
                    Ouvir
                  </button>
                  <input
                    id="salesPending"
                    type="checkbox"
                    checked={prefs.salesPending}
                    onChange={() => handleToggle("salesPending")}
                    className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                  />
                </div>
              </div>

              {/* Reembolso */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="refunds" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    ↩️ Reembolso
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400">
                      som_reembolso
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Devoluções e estornos com atualização financeira automática
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest("som_reembolso")}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#142C52] hover:bg-slate-50 dark:hover:bg-[#0E2547] text-slate-700 dark:text-slate-300 transition"
                  >
                    Ouvir
                  </button>
                  <input
                    id="refunds"
                    type="checkbox"
                    checked={prefs.refunds}
                    onChange={() => handleToggle("refunds")}
                    className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                  />
                </div>
              </div>

              {/* Chargeback */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="chargebacks" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer flex items-center gap-2">
                    🚨 Chargeback
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                      som_chargeback
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contestações e alertas de risco com severidade crítica
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTest("som_chargeback")}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#142C52] hover:bg-slate-50 dark:hover:bg-[#0E2547] text-slate-700 dark:text-slate-300 transition"
                  >
                    Ouvir
                  </button>
                  <input
                    id="chargebacks"
                    type="checkbox"
                    checked={prefs.chargebacks}
                    onChange={() => handleToggle("chargebacks")}
                    className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Alertas Operacionais */}
          <div className="bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#142C52] pb-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Alertas do Sistema & Integrações
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monitoramento técnico de APIs, webhooks e tracking
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#142C52]/60">
              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="systemAlerts" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                    Alertas críticos
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Avisos de expiração de token Meta Ads, limite de requisições ou anomalias
                  </p>
                </div>
                <input
                  id="systemAlerts"
                  type="checkbox"
                  checked={prefs.systemAlerts}
                  onChange={() => handleToggle("systemAlerts")}
                  className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="integrationErrors" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                    Falhas de integração
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Notificar quando um webhook de checkout retornar payload inválido ou erro de assinatura
                  </p>
                </div>
                <input
                  id="integrationErrors"
                  type="checkbox"
                  checked={prefs.integrationErrors}
                  onChange={() => handleToggle("integrationErrors")}
                  className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Sons e Vibração */}
          <div className="bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#142C52] pb-3">
              <div className="p-2 rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Sensorial & Dispositivo
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preferências globais de áudio e feedback háptico
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div 
                onClick={() => handleToggle("soundEnabled")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  prefs.soundEnabled 
                    ? "bg-[#0066FF]/5 border-[#0066FF] dark:bg-[#0066FF]/10" 
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-[#142C52] opacity-75"
                }`}
              >
                <div className="flex items-center gap-3">
                  {prefs.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-[#0066FF]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Sons</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {prefs.soundEnabled ? "Ativado" : "Desativado"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.soundEnabled}
                  onChange={() => {}}
                  className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer pointer-events-none"
                />
              </div>

              <div 
                onClick={() => handleToggle("vibrationEnabled")}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  prefs.vibrationEnabled 
                    ? "bg-[#0066FF]/5 border-[#0066FF] dark:bg-[#0066FF]/10" 
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-[#142C52] opacity-75"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className={`w-5 h-5 ${prefs.vibrationEnabled ? "text-[#0066FF]" : "text-slate-400"}`} />
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Vibração</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {prefs.vibrationEnabled ? "Ativada" : "Desativada"}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.vibrationEnabled}
                  onChange={() => {}}
                  className="w-5 h-5 rounded text-[#0066FF] focus:ring-[#0066FF] border-slate-300 dark:border-[#142C52] cursor-pointer pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Teste Real de Notificação Push */}
          <PushTestSection />
        </div>
      )}
    </div>
  );
}

function PushTestSection() {
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);

  const handleSendTest = async () => {
    setIsSending(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "UTM-Track",
          message: "Notificação de teste recebida com sucesso. Seu aplicativo está configurado corretamente.",
          sound: "som_venda_aprovada",
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({
          type: "success",
          text: data.message || "Notificação de teste enviada com sucesso para o seu dispositivo Android.",
        });
        await playNotificationSound("som_venda_aprovada");
      } else if (data.warning) {
        setStatusMsg({
          type: "warning",
          text: data.message || "Nenhum dispositivo registrado. Abra o aplicativo UTM-Track no celular.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: data.error || "Não foi possível enviar a notificação. Verifique a configuração do dispositivo.",
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: "Erro de conexão ao solicitar envio do teste.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#081A33] border border-slate-200 dark:border-[#142C52] rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#142C52] pb-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Testar Notificações Push
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envie uma notificação real para verificar se seu dispositivo está configurado corretamente.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md">
          Dispara um Push Notification via FCM para o aplicativo UTM-Track instalado no seu celular, tocando o áudio proprietário e abrindo o aplicativo.
        </p>

        <button
          onClick={handleSendTest}
          disabled={isSending}
          className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Bell className={`w-3.5 h-3.5 ${isSending ? "animate-bounce" : ""}`} />
          {isSending ? "Enviando..." : "🔔 Enviar notificação de teste"}
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border animate-in fade-in ${
            statusMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : statusMsg.type === "warning"
              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="font-semibold">{statusMsg.text}</div>
        </div>
      )}
    </div>
  );
}