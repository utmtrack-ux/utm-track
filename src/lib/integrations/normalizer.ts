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
