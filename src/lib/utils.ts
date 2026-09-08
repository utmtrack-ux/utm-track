import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
export { formatMetric } from "./metrics";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DateRange = {
  from: Date;
  to: Date;
  label: string;
};

export function getDateRange(preset: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return { from: today, to: new Date(), label: "Hoje" };
    case "yesterday": {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: new Date(yesterday.getTime() + 86399999), label: "Ontem" };
    }
    case "last7days":
      return { from: subDays(today, 6), to: new Date(), label: "Últimos 7 dias" };
    case "last30days":
      return { from: subDays(today, 29), to: new Date(), label: "Últimos 30 dias" };
    case "thisMonth":
      return { from: startOfMonth(now), to: new Date(), label: "Este mês" };
    case "lastMonth": {
      const lastMonth = subMonths(now, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        label: "Mês anterior",
      };
    }
    default:
      return { from: subDays(today, 29), to: new Date(), label: "Últimos 30 dias" };
  }
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: ptBR });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateId(prefix = ""): string {
  const random = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/** Truncate a string for display */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

/** Parse a JSON string safely, returning null on failure */
export function safeParseJSON<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Convert a value to cents (integer) */
export function toCents(value: number): number {
  return Math.round(value * 100);
}

/** Convert cents to decimal currency value */
export function fromCents(cents: number): number {
  return cents / 100;
}
