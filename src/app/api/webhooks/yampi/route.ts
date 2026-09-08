import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { upsertSale } from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (process.env.YAMPI_WEBHOOK_SECRET && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      if (token !== process.env.YAMPI_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(req.url)
    const queryWs = searchParams.get('workspaceId') || searchParams.get('workspace_id') || req.headers.get('x-workspace-id')

    const body = await req.json()
    const order = body.resource || body

    if (!order) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let workspaceId: string | null | undefined = queryWs
    if (!workspaceId) {
      const integration = await prisma.integration.findFirst({
        where: { platform: 'yampi' }
      })
      workspaceId = integration?.workspaceId
    }

    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultWs) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      workspaceId = defaultWs.id
    }

    let status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' = 'pending'
    const alias = order.status?.alias || order.status || 'unknown'
    if (alias === 'payment_approved' || alias === 'paid') status = 'approved'
    else if (alias === 'refunded') status = 'refunded'
    else if (alias === 'chargeback') status = 'chargeback'
    else if (alias === 'cancelled') status = 'cancelled'
    else if (alias === 'pending') status = 'pending'

    const orderId = order.id ? order.id.toString() : String(Date.now())
    const idempotencyKey = `yampi_${orderId}_${alias}`
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey }
    })

    if (existingWebhook) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    const paymentType = (order.payment_method || order.payment?.method || '').toLowerCase()
    const paymentMethod = paymentType.includes('pix') || alias.includes('pix') ? 'pix' : (paymentType.includes('boleto') || paymentType.includes('billet')) ? 'boleto' : 'card'

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey,
        workspaceId,
        source: 'yampi',
        eventType: alias,
        payload: JSON.stringify(body)
      }
    })

    const createdAt = order.created_at?.date || order.created_at || Date.now()
    const grossVal = order.value ? parseFloat(order.value) : (order.total ? parseFloat(order.total) : 0)

    const sale = await upsertSale({
      workspaceId,
      platform: 'yampi',
      externalId: orderId,
      externalRef: paymentMethod,
      status,
      grossAmount: grossVal,
      netAmount: grossVal,
      currency: 'BRL',
      customerEmail: order.customer?.email,
      utmSource: order.utm_source,
      utmMedium: order.utm_medium,
      utmCampaign: order.utm_campaign,
      utmContent: order.utm_content,
      utmTerm: order.utm_term,
      orderedAt: new Date(createdAt),
      approvedAt: status === 'approved' ? new Date() : undefined,
      refundedAt: status === 'refunded' ? new Date() : undefined
    })

    // Disparo de notificação oficial UTM-Track
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'
    else if (status === 'chargeback') notifType = 'chargeback'
    else if (alias.includes('pix') || paymentType.includes('pix')) notifType = 'pix_pending'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: grossVal,
      currency: 'BRL',
      platform: 'Yampi',
      saleId: sale.id,
      transactionId: orderId,
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true, saleId: sale.id })
  } catch (error) {
    console.error('Yampi webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
