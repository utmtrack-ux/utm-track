import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  normalizeSaleAmount, 
  normalizeNetAmount, 
  normalizeSaleStatus, 
  normalizeSalePaymentMethod, 
  normalizeSaleUtms, 
  upsertSale 
} from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const hottok = req.headers.get('x-hotmart-hottok')
    if (process.env.HOTMART_WEBHOOK_SECRET && hottok && hottok !== process.env.HOTMART_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryWs = searchParams.get('workspaceId') || searchParams.get('workspace_id') || req.headers.get('x-workspace-id')

    const payload = await req.json()
    const { event, data } = payload
    
    if (!data || !data.purchase) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let workspaceId: string | null | undefined = queryWs
    if (!workspaceId) {
      const integration = await prisma.integration.findFirst({ 
        where: { platform: 'hotmart' } 
      })
      workspaceId = integration?.workspaceId
    }

    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultWs) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      workspaceId = defaultWs.id
    }

    const idempotencyKey = `hotmart_${data.purchase.transaction}_${event}`
    
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey }
    })

    if (existingWebhook) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    const status = normalizeSaleStatus(event, 'hotmart')
    const paymentMethod = normalizeSalePaymentMethod(payload, 'hotmart')
    const utms = normalizeSaleUtms(payload)
    const grossPrice = normalizeSaleAmount(payload, 'hotmart')
    const netPrice = normalizeNetAmount(payload, 'hotmart', grossPrice)

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey,
        workspaceId,
        source: 'hotmart',
        eventType: event,
        payload: JSON.stringify(payload)
      }
    })

    const sale = await upsertSale({
      workspaceId,
      platform: 'hotmart',
      externalId: String(data.purchase.transaction),
      externalRef: paymentMethod,
      status,
      grossAmount: grossPrice,
      netAmount: netPrice,
      currency: data.purchase.price ? String(data.purchase.price.currency_code || 'BRL') : 'BRL',
      customerEmail: data.buyer ? String(data.buyer.email) : undefined,
      utmSource: utms.utmSource,
      utmMedium: utms.utmMedium,
      utmCampaign: utms.utmCampaign,
      utmContent: utms.utmContent,
      utmTerm: utms.utmTerm,
      fbclid: utms.fbclid,
      fbp: utms.fbp,
      fbc: utms.fbc,
      sessionId: utms.sessionId,
      orderedAt: new Date(data.purchase.order_date || Date.now()),
      approvedAt: status === 'approved' ? new Date(data.purchase.approved_date || Date.now()) : undefined,
      refundedAt: status === 'refunded' ? new Date() : undefined
    })

    // Disparo de notificação oficial UTM-Track com som correspondente
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'
    else if (status === 'chargeback') notifType = 'chargeback'
    else if (event.includes('PIX') || paymentMethod === 'pix') notifType = 'pix_pending'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: grossPrice,
      currency: data.purchase.price ? String(data.purchase.price.currency_code || 'BRL') : 'BRL',
      platform: 'Hotmart',
      product: data.product?.name,
      saleId: sale.id,
      transactionId: data.purchase.transaction,
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true, saleId: sale.id })
  } catch (error) {
    console.error('Hotmart webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
