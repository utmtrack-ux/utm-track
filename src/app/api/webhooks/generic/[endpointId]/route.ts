import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuid } from 'uuid'

export async function POST(req: Request, { params }: { params: Promise<{ endpointId: string }> }) {
  try {
    const { endpointId } = await params
    
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { endpointId }
    })

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }

    const rawBody = await req.text()

    await prisma.webhookEvent.create({
      data: {
        idempotencyKey: `generic_${uuid()}`,
        workspaceId: endpoint.workspaceId,
        endpointId: endpoint.endpointId,
        source: 'generic',
        eventType: 'generic',
        payload: rawBody || '{}'
      }
    })

    await prisma.webhookEndpoint.update({
      where: { endpointId },
      data: {
        eventCount: { increment: 1 },
        lastEventAt: new Date()
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Generic webhook error:', error)
    return NextResponse.json({ success: true })
  }
}
