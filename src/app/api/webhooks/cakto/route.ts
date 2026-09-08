import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { upsertSale } from '@/lib/integrations/normalizer'
import { createSaleNotification, SaleNotificationType } from '@/lib/notifications/service'

export async function POST(req: Request) {
  try {
    const signature = req.headers.get('x-cakto-signature') || req.headers.get('x-cacto-signature') || req.headers.get('Authorization')
    const secret = process.env.CAKTO_WEBHOOK_SECRET || process.env.CACTO_WEBHOOK_SECRET
    if (secret && signature && signature !== secret && signature !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryWs = searchParams.get('workspaceId') || searchParams.get('workspace_id') || req.headers.get('x-workspace-id')

    const body = await req.json()
    // Cakto webhook supports standard structure (event / data or flat payload)
    const id = body.id || body.data?.id || body.data?.transaction?.id || body.transaction_id || body.order_id
    const caktoStatus = (body.status || body.event || body.data?.status || body.data?.event || '').toString().toLowerCase()
    const amount = Number(body.amount || body.data?.amount || body.data?.price || body.data?.total || 0)
    const currency = body.currency || body.data?.currency || 'BRL'
    const email = body.email || body.customer?.email || body.data?.customer?.email || body.data?.buyer?.email
    const utms = body.utms || body.utm || body.data?.utms || body.tracking || body.data?.tracking || {}
    const created_at = body.created_at || body.data?.created_at || body.createdAt

    if (!id) {
      return NextResponse.json({ error: 'Invalid payload: missing transaction id' }, { status: 400 })
    }

    let workspaceId: string | null | undefined = queryWs
    if (!workspaceId) {
      const integration = await prisma.integration.findFirst({
        where: { platform: { in: ['cakto', 'cacto'] } }
      })
      workspaceId = integration?.workspaceId
    }

    if (!workspaceId) {
      const defaultWs = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } })
      if (!defaultWs) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      workspaceId = defaultWs.id
    }

    let status: 'approved' | 'pending' | 'refunded' | 'chargeback' | 'cancelled' = 'pending'
    if (caktoStatus.includes('approved') || caktoStatus.includes('paid') || caktoStatus.includes('complete') || caktoStatus === 'purchase_approved') {
      status = 'approved'
    } else if (caktoStatus.includes('refund')) {
      status = 'refunded'
    } else if (caktoStatus.includes('chargeback')) {
      status = 'chargeback'
    } else if (caktoStatus.includes('cancel') || caktoStatus.includes('fail') || caktoStatus.includes('refused')) {
      status = 'cancelled'
    } else if (caktoStatus.includes('waiting') || caktoStatus.includes('pending') || caktoStatus.includes('pix')) {
      status = 'pending'
    }

    const idempotencyKey = `cakto_${id}_${status}_${caktoStatus}`
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { idempotencyKey }
    })

    if (existingWebhook) {
      return NextResponse.json({ success: true, message: 'Already processed (idempotent)' })
    }

    const paymentType = (body.payment_method || body.data?.payment_method || body.data?.payment?.type || '').toLowerCase()
    const paymentMethod = paymentType.includes('pix') || caktoStatus.includes('pix') ? 'pix' : (paymentType.includes('boleto') || paymentType.includes('billet')) ? 'boleto' : 'card'

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey,
        workspaceId,
        source: 'cakto',
        eventType: caktoStatus || 'unknown',
        payload: JSON.stringify(body)
      }
    })

    const sale = await upsertSale({
      workspaceId,
      platform: 'cakto',
      externalId: id.toString(),
      externalRef: paymentMethod,
      status,
      grossAmount: amount || 0,
      netAmount: amount || 0,
      currency: currency || 'BRL',
      customerEmail: email,
      utmSource: utms?.source || utms?.utm_source,
      utmMedium: utms?.medium || utms?.utm_medium,
      utmCampaign: utms?.campaign || utms?.utm_campaign,
      utmContent: utms?.content || utms?.utm_content,
      utmTerm: utms?.term || utms?.utm_term,
      orderedAt: new Date(created_at || Date.now()),
      approvedAt: status === 'approved' ? new Date() : undefined,
      refundedAt: status === 'refunded' ? new Date() : undefined
    })

    // Disparo de notificação oficial UTM-Track
    let notifType: SaleNotificationType = 'sale_pending'
    if (status === 'approved') notifType = 'sale_approved'
    else if (status === 'refunded') notifType = 'refund'
    else if (status === 'chargeback') notifType = 'chargeback'
    else if (caktoStatus.includes('pix') || paymentType.includes('pix')) notifType = 'pix_pending'

    await createSaleNotification({
      workspaceId,
      type: notifType,
      amount: amount || 0,
      currency: currency || 'BRL',
      platform: 'Cakto',
      saleId: sale.id,
      transactionId: id.toString(),
    }).catch(e => console.error('Notification dispatch error:', e))

    return NextResponse.json({ success: true, saleId: sale.id, status })
  } catch (error) {
    console.error('Cakto webhook error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
