import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { upsertSale } from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
    const topic = req.headers.get('x-shopify-topic')

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic header' }, { status: 400 })
    }

    const secret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (secret && hmacHeader) {
      const hash = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64')
      try {
        if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader))) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = JSON.parse(rawBody || '{}')

    let integration = await prisma.integration.findFirst({
      where: { platform: 'shopify' }
    })

    let workspaceId = integration?.workspaceId
    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultWs) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      workspaceId = defaultWs.id
    }

    const idempotencyKey = `shopify_${body.id || Date.now()}_${topic}`
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey }
    })

    if (existingWebhook) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    let status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' = 'pending'
    if (topic === 'orders/paid') status = 'approved'
    else if (topic === 'refunds/create') status = 'refunded'
    else if (topic === 'orders/cancelled') status = 'cancelled'
    else if (topic === 'orders/create') status = 'pending'
    else {
      return NextResponse.json({ success: true })
    }

    const attributes = body.note_attributes || []
    const getAttr = (name: string): string | undefined => {
      const attr = attributes.find((a: Record<string, unknown>) => a.name === name)
      return attr ? String(attr.value) : undefined
    }

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey,
        workspaceId,
        source: 'shopify',
        eventType: topic,
        payload: rawBody
      }
    })

    const sale = await upsertSale({
      workspaceId,
      platform: 'shopify',
      externalId: String(body.id),
      status,
      grossAmount: parseFloat(body.total_price || '0'),
      netAmount: parseFloat(body.total_price || '0') - (parseFloat(body.total_refunded_amount || '0')),
      currency: body.currency || 'BRL',
      customerEmail: body.email,
      utmSource: getAttr('utm_source'),
      utmMedium: getAttr('utm_medium'),
      utmCampaign: getAttr('utm_campaign'),
      utmContent: getAttr('utm_content'),
      utmTerm: getAttr('utm_term'),
      orderedAt: new Date(body.created_at || Date.now()),
      approvedAt: status === 'approved' ? new Date() : undefined
    })

    // Disparo de notificação oficial UTM-Track
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: parseFloat(body.total_price || '0'),
      currency: body.currency || 'BRL',
      platform: 'Shopify',
      product: body.line_items?.[0]?.title,
      saleId: sale.id,
      transactionId: String(body.id),
      orderId: body.order_number ? String(body.order_number) : undefined,
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shopify webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
