import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserWorkspaceId } from '@/lib/workspace'
import { syncAdAccount } from '@/lib/meta/sync'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspaceId = await getUserWorkspaceId(session.user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    let body: { accountId?: string } = {}
    try {
      body = await req.json()
    } catch {}

    const accountId = body.accountId

    if (accountId) {
      const result = await syncAdAccount(workspaceId, accountId)
      return NextResponse.json(result)
    }

    // Se nenhum accountId especificado, sincroniza todas as contas do workspace
    const accounts = await prisma.adAccount.findMany({
      where: { workspaceId }
    })

    if (accounts.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma conta para sincronizar', synced: 0 })
    }

    const results = []
    for (const acc of accounts) {
      const res = await syncAdAccount(workspaceId, acc.id)
      results.push({ accountId: acc.id, ...res })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Meta sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
