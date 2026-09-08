import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserWorkspaceId } from '@/lib/workspace'
import { syncAdAccount } from '@/lib/meta/sync'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = await getUserWorkspaceId(session.user.id)
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await req.json()
    const { selectedAccountIds, syncImmediately } = body

    if (!Array.isArray(selectedAccountIds)) {
      return NextResponse.json(
        { error: 'Formato inválido: selectedAccountIds deve ser um array de IDs' },
        { status: 400 }
      )
    }

    // 1. Atualizar status das contas selecionadas para active
    await prisma.adAccount.updateMany({
      where: {
        workspaceId,
        id: { in: selectedAccountIds },
      },
      data: { status: 'active' },
    })

    // 2. Opcional: atualizar contas desmarcadas para inactive
    await prisma.adAccount.updateMany({
      where: {
        workspaceId,
        id: { notIn: selectedAccountIds },
      },
      data: { status: 'inactive' },
    })

    const syncResults = []

    // 3. Se solicitado, executa a sincronização inicial das contas selecionadas
    if (syncImmediately && selectedAccountIds.length > 0) {
      for (const accId of selectedAccountIds) {
        const res = await syncAdAccount(workspaceId, accId)
        syncResults.push({ accountId: accId, ...res })
      }
    }

    return NextResponse.json({
      success: true,
      activatedCount: selectedAccountIds.length,
      syncResults,
    })
  } catch (error: unknown) {
    console.error('Error selecting ad accounts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

