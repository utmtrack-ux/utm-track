import { prisma } from '@/lib/db'
import { attemptAttribution } from '@/lib/tracking/attribution'

export interface InternalSale {
  workspaceId: string
  platform: string
  externalId: string
  externalRef?: string
  status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled'
  grossAmount: number
  netAmount: number
  currency: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  fbp?: string
  fbc?: string
  sessionId?: string
  customerEmail?: string
  orderedAt: Date
  approvedAt?: Date
  refundedAt?: Date
}

/**
 * Normaliza valores monetários vindos de qualquer gateway ou payload
 */
export function normalizeSaleAmount(payload: Record<string, unknown>, provider = 'generic'): number {
  if (!payload) return 0

  let rawVal: unknown = undefined

  const pLower = (provider || '').toLowerCase()
  const data = (payload.data as Record<string, unknown>) || {}
  const purchase = (data.purchase as Record<string, unknown>) || (payload.purchase as Record<string, unknown>) || {}
  const resource = (payload.resource as Record<string, unknown>) || {}

  if (pLower.includes('hotmart')) {
    const priceObj = (purchase.price as Record<string, unknown>) || {}
    const origObj = (purchase.original_offer_price as Record<string, unknown>) || {}
    const fullObj = (purchase.full_price as Record<string, unknown>) || {}
    rawVal = priceObj.value ?? origObj.value ?? fullObj.value ?? purchase.price ?? purchase.original_offer_price
  } else if (pLower.includes('cakto') || pLower.includes('cacto')) {
    rawVal = payload.amount ?? data.amount ?? data.price ?? data.total ?? payload.value ?? payload.price
  } else if (pLower.includes('yampi')) {
    rawVal = resource.value ?? resource.total ?? payload.value ?? payload.total
  } else if (pLower.includes('shopify')) {
    rawVal = payload.total_price ?? payload.current_total_price ?? payload.subtotal_price
  } else {
    // Genérico / Outros gateways
    rawVal =
      payload.grossAmount ??
      payload.amount ??
      payload.total_amount ??
      payload.order_amount ??
      payload.value ??
      payload.price ??
      payload.total ??
      data.amount ??
      data.value ??
      data.price ??
      data.total
  }

  if (rawVal === undefined || rawVal === null) return 0

  if (typeof rawVal === 'number') {
    return isNaN(rawVal) ? 0 : Math.round(rawVal * 100) / 100
  }

  if (typeof rawVal === 'string') {
    // Tratar formatos como "1.299,00" ou "197.00" ou "R$ 197,00"
    const cleaned = rawVal.replace(/[R$\s]/g, '').trim()
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Formato brasileiro "1.299,50" -> 1299.50
      const parsed = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
    } else if (cleaned.includes(',')) {
      // Formato com vírgula "197,50" -> 197.50
      const parsed = parseFloat(cleaned.replace(',', '.'))
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
    } else {
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
    }
  }

  return 0
}

/**
 * Normaliza o valor líquido da venda
 */
export function normalizeNetAmount(
  payload: Record<string, unknown>,
  provider = 'generic',
  grossAmount: number
): number {
  if (!payload) return grossAmount

  const pLower = (provider || '').toLowerCase()
  const data = (payload.data as Record<string, unknown>) || {}
  const purchase = (data.purchase as Record<string, unknown>) || (payload.purchase as Record<string, unknown>) || {}
  const resource = (payload.resource as Record<string, unknown>) || {}

  let netVal: unknown = undefined

  if (pLower.includes('hotmart')) {
    const commissionObj = (purchase.commission as Record<string, unknown>) || {}
    netVal = commissionObj.value ?? purchase.commission
  } else if (pLower.includes('cakto') || pLower.includes('cacto')) {
    netVal = payload.net_amount ?? data.net_amount ?? data.liquid_amount ?? payload.liquid_amount
  } else if (pLower.includes('yampi')) {
    netVal = resource.net_value ?? resource.liquid_value ?? payload.net_value
  } else if (pLower.includes('shopify')) {
    const refunded = parseFloat(String(payload.total_refunded_amount || '0'))
    if (!isNaN(refunded) && refunded > 0) {
      return Math.max(0, grossAmount - refunded)
    }
  } else {
    netVal = payload.netAmount ?? payload.net_amount ?? payload.liquid_amount
  }

  if (netVal !== undefined && netVal !== null) {
    const parsed = typeof netVal === 'number' ? netVal : parseFloat(String(netVal).replace(',', '.'))
    if (!isNaN(parsed) && parsed > 0) {
      return Math.round(parsed * 100) / 100
    }
  }

  // Fallback prioritário: valor bruto
  return grossAmount
}

/**
 * Normaliza status da venda para padrão unificado
 */
export function normalizeSaleStatus(
  rawStatus: string,
  _provider = 'generic'
): 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' {
  if (!rawStatus) return 'pending'

  const s = rawStatus.toLowerCase().trim()

  if (
    s === 'purchase_approved' ||
    s === 'purchase_complete' ||
    s === 'orders/paid' ||
    s === 'payment_approved' ||
    s === 'approved' ||
    s === 'paid' ||
    s === 'completed' ||
    s === 'settled' ||
    s === 'pago' ||
    s === 'aprovado' ||
    s.includes('approved') ||
    s.includes('paid')
  ) {
    return 'approved'
  }

  if (
    s === 'purchase_refunded' ||
    s === 'refunds/create' ||
    s === 'refunded' ||
    s === 'reembolsado' ||
    s === 'estornado' ||
    s === 'devolvido' ||
    s.includes('refund')
  ) {
    return 'refunded'
  }

  if (
    s === 'purchase_chargeback' ||
    s === 'chargeback' ||
    s === 'dispute' ||
    s === 'contestacao' ||
    s.includes('chargeback')
  ) {
    return 'chargeback'
  }

  if (
    s === 'purchase_canceled' ||
    s === 'orders/cancelled' ||
    s === 'cancelled' ||
    s === 'canceled' ||
    s === 'recusado' ||
    s === 'falhado' ||
    s === 'failed' ||
    s.includes('cancel') ||
    s.includes('refused')
  ) {
    return 'cancelled'
  }

  return 'pending'
}

/**
 * Normaliza método de pagamento (pix, card, boleto)
 */
export function normalizeSalePaymentMethod(payload: Record<string, unknown>, _provider = 'generic'): string {
  if (!payload) return 'card'

  const data = (payload.data as Record<string, unknown>) || {}
  const purchase = (data.purchase as Record<string, unknown>) || (payload.purchase as Record<string, unknown>) || {}
  const payment = (purchase.payment as Record<string, unknown>) || (payload.payment as Record<string, unknown>) || {}
  const resource = (payload.resource as Record<string, unknown>) || {}

  const rawType = String(
    payment.type ||
    payload.payment_method ||
    payload.payment_type ||
    data.payment_method ||
    resource.payment_method ||
    payload.gateway ||
    (payload.payment_gateway_names as string[])?.[0] ||
    ''
  ).toLowerCase()

  if (rawType.includes('pix')) return 'pix'
  if (rawType.includes('boleto') || rawType.includes('billet') || rawType.includes('bank_slip')) return 'boleto'
  if (rawType.includes('card') || rawType.includes('cartao') || rawType.includes('credito') || rawType.includes('debito')) return 'card'

  return rawType || 'card'
}

/**
 * Extrai e normaliza parâmetros UTM de qualquer estrutura de payload
 */
export function normalizeSaleUtms(payload: Record<string, unknown>): {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  fbclid?: string
  fbp?: string
  fbc?: string
  sessionId?: string
} {
  if (!payload) return {}

  const data = (payload.data as Record<string, unknown>) || {}
  const purchase = (data.purchase as Record<string, unknown>) || {}
  const tracking = (purchase.tracking as Record<string, unknown>) || (payload.tracking as Record<string, unknown>) || (payload.utms as Record<string, unknown>) || (payload.utm as Record<string, unknown>) || (data.utms as Record<string, unknown>) || {}
  const noteAttributes = (payload.note_attributes as Array<{ name: string; value: string }>) || []

  const getAttr = (name: string): string | undefined => {
    const attr = noteAttributes.find(a => a.name === name)
    return attr ? String(attr.value) : undefined
  }

  return {
    utmSource: String(tracking.utm_source || tracking.source || tracking.src || payload.utm_source || payload.src || getAttr('utm_source') || '').trim() || undefined,
    utmMedium: String(tracking.utm_medium || tracking.medium || payload.utm_medium || getAttr('utm_medium') || '').trim() || undefined,
    utmCampaign: String(tracking.utm_campaign || tracking.campaign || payload.utm_campaign || getAttr('utm_campaign') || '').trim() || undefined,
    utmContent: String(tracking.utm_content || tracking.content || payload.utm_content || getAttr('utm_content') || '').trim() || undefined,
    utmTerm: String(tracking.utm_term || tracking.term || payload.utm_term || getAttr('utm_term') || '').trim() || undefined,
    fbclid: String(tracking.fbclid || payload.fbclid || getAttr('fbclid') || '').trim() || undefined,
    fbp: String(tracking.fbp || payload.fbp || getAttr('_fbp') || '').trim() || undefined,
    fbc: String(tracking.fbc || payload.fbc || getAttr('_fbc') || '').trim() || undefined,
    sessionId: String(tracking.sessionId || payload.sessionId || payload._utmt_sid || '').trim() || undefined,
  }
}

export async function upsertSale(sale: InternalSale) {
  const result = await prisma.sale.upsert({
    where: { 
      workspaceId_platform_externalId: { 
        workspaceId: sale.workspaceId, 
        platform: sale.platform, 
        externalId: sale.externalId 
      } 
    },
    create: { ...sale },
    update: { 
      status: sale.status, 
      grossAmount: sale.grossAmount,
      netAmount: sale.netAmount,
      currency: sale.currency,
      approvedAt: sale.approvedAt, 
      refundedAt: sale.refundedAt, 
      updatedAt: new Date(),
      utmSource: sale.utmSource,
      utmMedium: sale.utmMedium,
      utmCampaign: sale.utmCampaign,
      utmContent: sale.utmContent,
      utmTerm: sale.utmTerm,
      fbclid: sale.fbclid,
      fbp: sale.fbp,
      fbc: sale.fbc,
      sessionId: sale.sessionId
    }
  })
  
  // Try attribution
  try { 
    await attemptAttribution(result.id) 
  } catch (e) { 
    console.error('Attribution error:', e) 
  }
  
  return result
}
