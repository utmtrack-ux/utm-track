import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { upsertSale } from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const hottok = req.headers.get('x-hotmart-hottok')
    if (process.env.HOTMART_WEBHOOK_SECRET && hottok && hottok !== process.env.HOTMART_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    const { event, data } = payload
    
    if (!data || !data.purchase) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let integration = await prisma.integration.findFirst({ 
      where: { platform: 'hotmart' } 
    })

    let workspaceId = integration?.workspaceId
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

    let status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' = 'pending'
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') status = 'approved'
    else if (event === 'PURCHASE_REFUNDED') status = 'refunded'
    else if (event === 'PURCHASE_CHARGEBACK') status = 'chargeback'
    else if (event === 'PURCHASE_CANCELED') status = 'cancelled'
    else if (event === 'PURCHASE_PENDING') status = 'pending'
    else {
      return NextResponse.json({ success: true, message: 'Unhandled event type' })
    }

    const tracking = data.purchase.tracking || {}

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
      externalId: data.purchase.transaction,
      status,
      grossAmount: data.purchase.price ? Number(data.purchase.price.value || 0) : 0,
      netAmount: data.purchase.commission ? Number(data.purchase.commission.value || 0) : 0,
      currency: data.purchase.price ? data.purchase.price.currency_code : 'BRL',
      customerEmail: data.buyer ? data.buyer.email : undefined,
      utmSource: tracking.utm_source,
      utmMedium: tracking.utm_medium,
      utmCampaign: tracking.utm_campaign,
      utmContent: tracking.utm_content,
      utmTerm: tracking.utm_term,
      orderedAt: new Date(data.purchase.order_date || Date.now()),
      approvedAt: status === 'approved' ? new Date(data.purchase.approved_date || Date.now()) : undefined
    })

    // Disparo de notificação oficial UTM-Track com som correspondente
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'
    else if (status === 'chargeback') notifType = 'chargeback'
    else if (event.includes('PIX') || payload.data?.purchase?.payment?.type === 'PIX') notifType = 'pix_pending'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: data.purchase.price ? Number(data.purchase.price.value || 0) : 0,
      currency: data.purchase.price ? data.purchase.price.currency_code : 'BRL',
      platform: 'Hotmart',
      product: data.product?.name,
      saleId: sale.id,
      transactionId: data.purchase.transaction,
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Hotmart webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
