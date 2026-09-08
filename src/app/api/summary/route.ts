import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserWorkspaceId } from '@/lib/workspace'
import {
  calcROAS, calcROI, calcMargin, calcProfit
} from '@/lib/metrics'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspaceId = await getUserWorkspaceId(session.user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    const from = fromStr ? new Date(fromStr) : new Date(Date.now() - 30 * 86400000)
    const to = toStr ? new Date(toStr) : new Date()

    // 1. Vendas
    const sales = await prisma.sale.findMany({
      where: {
        workspaceId,
        orderedAt: { gte: from, lte: to }
      }
    })

    const totalSales = sales.length
    const approvedSales = sales.filter(s => s.status === 'approved')
    const grossRevenue = sales.reduce((acc, s) => acc + s.grossAmount, 0)
    const netRevenue = sales.reduce((acc, s) => acc + s.netAmount, 0)
    const ticketMedio = approvedSales.length > 0 ? (grossRevenue / approvedSales.length) : 0
    const taxaAprovacao = totalSales > 0 ? ((approvedSales.length / totalSales) * 100) : 0

    // 2. Investimento Meta Ads
    const insightsAgg = await prisma.campaignInsight.aggregate({
      where: {
        campaign: { workspaceId },
        dateStart: { gte: from },
        dateStop: { lte: to }
      },
      _sum: { spend: true, impressions: true, clicks: true, conversions: true }
    })

    const totalSpend = insightsAgg._sum?.spend || 0
    const totalImpressions = insightsAgg._sum?.impressions || 0
    const totalClicks = insightsAgg._sum?.clicks || 0

    // 3. Despesas & Taxas
    const expenses = await prisma.expense.findMany({
      where: {
        workspaceId,
        date: { gte: from, lte: to },
        isActive: true
      }
    })
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)

    const profit = calcProfit({
      netRevenue,
      adSpend: totalSpend,
      productCost: 0,
      fees: 0,
      taxes: 0,
      expenses: totalExpenses
    })

    // 4. Distribuição por plataforma
    const platformMap = new Map<string, { count: number, revenue: number }>()
    for (const s of sales) {
      const p = s.platform || 'outros'
      const cur = platformMap.get(p) || { count: 0, revenue: 0 }
      cur.count += 1
      cur.revenue += s.grossAmount
      platformMap.set(p, cur)
    }

    const platformDistribution = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform,
      count: data.count,
      revenue: data.revenue,
      percentage: grossRevenue > 0 ? (data.revenue / grossRevenue) * 100 : 0
    }))

    return NextResponse.json({
      grossRevenue,
      netRevenue,
      totalSpend,
      profit,
      roas: calcROAS(grossRevenue, totalSpend),
      roi: calcROI(profit, totalSpend + totalExpenses),
      margin: calcMargin(profit, grossRevenue),
      totalSales,
      approvedSalesCount: approvedSales.length,
      ticketMedio,
      taxaAprovacao,
      totalImpressions,
      totalClicks,
      totalExpenses,
      platformDistribution
    })
  } catch (error) {
    console.error('Error fetching consolidated summary:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
