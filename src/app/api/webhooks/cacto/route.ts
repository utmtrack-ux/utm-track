import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { upsertSale } from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-cacto-signature') || req.headers.get('Authorization')
    if (process.env.CACTO_WEBHOOK_SECRET && signature && signature !== process.env.CACTO_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, status: cactoStatus, amount, currency, email, utms, created_at } = body

    if (!id || !cactoStatus) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    let integration = await prisma.integration.findFirst({
      where: { platform: 'cacto' }
    })

    let workspaceId = integration?.workspaceId
    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultWs) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      workspaceId = defaultWs.id
    }

    let status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' = 'pending'
    if (cactoStatus === 'approved' || cactoStatus === 'paid') status = 'approved'
    else if (cactoStatus === 'refunded') status = 'refunded'
    else if (cactoStatus === 'chargeback') status = 'chargeback'
    else if (cactoStatus === 'cancelled' || cactoStatus === 'failed') status = 'cancelled'

    const idempotencyKey = `cacto_${id}_${cactoStatus}`
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey }
    })

    if (existingWebhook) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey,
        workspaceId,
        source: 'cacto',
        eventType: cactoStatus,
        payload: JSON.stringify(body)
      }
    })

    const sale = await upsertSale({
      workspaceId,
      platform: 'cacto',
      externalId: id.toString(),
      status,
      grossAmount: amount || 0,
      netAmount: amount || 0,
      currency: currency || 'BRL',
      customerEmail: email,
      utmSource: utms?.source,
      utmMedium: utms?.medium,
      utmCampaign: utms?.campaign,
      utmContent: utms?.content,
      utmTerm: utms?.term,
      orderedAt: new Date(created_at || Date.now()),
      approvedAt: status === 'approved' ? new Date() : undefined
    })

    // Disparo de notificação oficial UTM-Track
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'
    else if (status === 'chargeback') notifType = 'chargeback'
    else if (cactoStatus.includes('pix')) notifType = 'pix_pending'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: amount || 0,
      currency: currency || 'BRL',
      platform: 'Cacto',
      saleId: sale.id,
      transactionId: id.toString(),
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cacto webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
