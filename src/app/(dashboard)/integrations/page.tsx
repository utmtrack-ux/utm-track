"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plug, TrendingUp, ShoppingBag, Code, ShieldCheck, CheckCircle2, XCircle, ArrowRight, ExternalLink } from "lucide-react";

export default function IntegrationsHubPage() {
  const { data: adAccountsData } = useQuery({
    queryKey: ["meta-accounts"],
    queryFn: () => fetch("/api/meta/accounts").then(r => r.json())
  });

  const { data: pixelsData } = useQuery({
    queryKey: ["pixels"],
    queryFn: () => fetch("/api/pixels").then(r => r.json())
  });

  const { data: endpointsData } = useQuery({
    queryKey: ["generic-endpoints"],
    queryFn: () => fetch("/api/webhooks/generic").then(r => r.json())
  });

  const connectedAccountsCount = adAccountsData?.accounts?.length || 0;
  const pixelsCount = pixelsData?.pixels?.length || 0;
  const genericEndpointsCount = endpointsData?.endpoints?.length || 0;

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hub de Integrações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerencie suas conexões de tráfego pago, plataformas de checkout, webhooks e pixels de conversão
        </p>
      </div>

      {/* Grid de Plataformas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Meta Ads */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                connectedAccountsCount > 0
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {connectedAccountsCount > 0 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {connectedAccountsCount} conta(s)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Desconectado
                  </>
                )}
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Meta Ads</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sincronização oficial de gastos, impressões, cliques e conversões via Graph API v21.0.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Link
              href="/meta-ads"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Gerenciar Contas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. Tracker Script */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
                <Code className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Tracker Próprio</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Script JS ultra-leve (&lt;3KB) não-bloqueante para capturar UTMs, fbclid, cookies _fbp/_fbc e sessão.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Link
              href="/integrations/tracker"
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-purple-700"
            >
              Ver Instruções de Instalação <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. Pixel & CAPI */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                {pixelsCount} pixel(s)
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Meta Pixel & CAPI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Disparo server-side de eventos para Meta Conversions API com hash SHA-256 e teste imediato.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <Link
              href="/integrations/pixel"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-emerald-700"
            >
              Gerenciar Pixels <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4. Hotmart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                Webhook Ativo
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Hotmart</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recebimento instantâneo de compras aprovadas, reembolsos e cancelamentos com validação <code className="text-xs">hottok</code>.
              </p>
            </div>
          </div>
          <div className="pt-6 space-y-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-mono truncate">
              /api/webhooks/hotmart
            </div>
            <Link
              href="/INTEGRATIONS.md"
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-700 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Documentação <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 5. Shopify */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-600 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                HMAC-SHA256
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Shopify</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Conexão para e-commerce com validação criptográfica de pedidos pagos, reembolsos e notas de UTM.
              </p>
            </div>
          </div>
          <div className="pt-6 space-y-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-mono truncate">
              /api/webhooks/shopify
            </div>
            <Link
              href="/INTEGRATIONS.md"
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-700 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Documentação <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* 6. Yampi & Cacto */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:border-blue-500 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 rounded-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                Ativo
              </span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Yampi & Cacto</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Checkouts transparentes e plataformas com webhooks dedicados para captura de pedidos e UTMs.
              </p>
            </div>
          </div>
          <div className="pt-6 space-y-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-[11px] font-mono truncate">
              /api/webhooks/yampi & cacto
            </div>
            <Link
              href="/INTEGRATIONS.md"
              target="_blank"
              className="w-full flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-700 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Documentação <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Webhook Genérico */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Webhooks Genéricos Customizados</h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Você tem {genericEndpointsCount} endpoint(s) personalizado(s) cadastrado(s) para receber vendas de qualquer gateway ou sistema proprietário.
          </p>
        </div>
        <Link
          href="/integrations/tracker"
          className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0"
        >
          Configurar Endpoints
        </Link>
      </div>
    </div>
  );
}
