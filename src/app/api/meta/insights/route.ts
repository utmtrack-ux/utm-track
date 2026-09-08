import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserWorkspaceId } from '@/lib/workspace'
import { calcCPC, calcCPM, calcCTR, calcCPA, calcROAS } from '@/lib/metrics'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspaceId = await getUserWorkspaceId(session.user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const level = searchParams.get('level') || 'campaign'
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400000)
    const to = toStr ? new Date(toStr) : new Date()

    if (level === 'adset') {
      const adSets = await prisma.adSet.findMany({
        where: { workspaceId },
        include: {
          insights: {
            where: { dateStart: { gte: from }, dateStop: { lte: to } }
          },
          campaign: { select: { name: true } }
        }
      })

      const data = adSets.map(as => {
        const spend = as.insights.reduce((acc, i) => acc + i.spend, 0)
        const impressions = as.insights.reduce((acc, i) => acc + i.impressions, 0)
        const clicks = as.insights.reduce((acc, i) => acc + i.clicks, 0)
        const conversions = as.insights.reduce((acc, i) => acc + i.conversions, 0)
        const revenue = as.insights.reduce((acc, i) => acc + i.conversionValue, 0)

        return {
          id: as.id,
          name: as.name,
          parentName: as.campaign?.name || '',
          status: as.status,
          spend,
          impressions,
          clicks,
          ctr: calcCTR(clicks, impressions),
          cpc: calcCPC(spend, clicks),
          cpm: calcCPM(spend, impressions),
          conversions,
          cpa: calcCPA(spend, conversions),
          revenue,
          roas: calcROAS(revenue, spend)
        }
      })

      return NextResponse.json({ data })
    }

    if (level === 'ad') {
      const ads = await prisma.ad.findMany({
        where: { workspaceId },
        include: {
          insights: {
            where: { dateStart: { gte: from }, dateStop: { lte: to } }
          },
          adSet: { select: { name: true } }
        }
      })

      const data = ads.map(ad => {
        const spend = ad.insights.reduce((acc, i) => acc + i.spend, 0)
        const impressions = ad.insights.reduce((acc, i) => acc + i.impressions, 0)
        const clicks = ad.insights.reduce((acc, i) => acc + i.clicks, 0)
        const conversions = ad.insights.reduce((acc, i) => acc + i.conversions, 0)
        const revenue = ad.insights.reduce((acc, i) => acc + i.conversionValue, 0)

        return {
          id: ad.id,
          name: ad.name,
          parentName: ad.adSet?.name || '',
          status: ad.status,
          spend,
          impressions,
          clicks,
          ctr: calcCTR(clicks, impressions),
          cpc: calcCPC(spend, clicks),
          cpm: calcCPM(spend, impressions),
          conversions,
          cpa: calcCPA(spend, conversions),
          revenue,
          roas: calcROAS(revenue, spend)
        }
      })

      return NextResponse.json({ data })
    }

    // Default: campaign level
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      include: {
        insights: {
          where: { dateStart: { gte: from }, dateStop: { lte: to } }
        }
      }
    })

    const data = campaigns.map(c => {
      const spend = c.insights.reduce((acc, i) => acc + i.spend, 0)
      const impressions = c.insights.reduce((acc, i) => acc + i.impressions, 0)
      const clicks = c.insights.reduce((acc, i) => acc + i.clicks, 0)
      const conversions = c.insights.reduce((acc, i) => acc + i.conversions, 0)
      const revenue = c.insights.reduce((acc, i) => acc + i.conversionValue, 0)

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        spend,
        impressions,
        clicks,
        ctr: calcCTR(clicks, impressions),
        cpc: calcCPC(spend, clicks),
        cpm: calcCPM(spend, impressions),
        conversions,
        cpa: calcCPA(spend, conversions),
        revenue,
        roas: calcROAS(revenue, spend)
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching meta insights:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
