import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, maskSecret } from '@/lib/encryption'
import { getUserWorkspaceId } from '@/lib/workspace'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getUserWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const pixels = await prisma.pixel.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ 
    pixels: pixels.map((p) => ({
      ...p,
      accessTokenEnc: p.accessTokenEnc ? maskSecret(p.accessTokenEnc) : null
    }))
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = await getUserWorkspaceId(session.user.id)
  if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()
  const { name, pixelId, accessToken, environment, testEventCode } = body

  if (!name || !pixelId) {
    return NextResponse.json({ error: 'Nome e Pixel ID são obrigatórios' }, { status: 400 })
  }

  const pixel = await prisma.pixel.create({
    data: {
      workspaceId,
      name,
      pixelId,
      accessTokenEnc: accessToken ? encrypt(accessToken) : null,
      environment: environment || 'production',
      testEventCode: testEventCode || null,
      status: 'active'
    }
  })

  return NextResponse.json({ pixel }, { status: 201 })
}

export async function PATCH(req: Request) {
  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  await prisma.pixel.delete({
    where: { id }
  })

  return NextResponse.json({ success: true })
}
