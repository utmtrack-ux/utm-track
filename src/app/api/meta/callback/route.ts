import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getUserWorkspaceId } from '@/lib/workspace'
import { encrypt } from '@/lib/encryption'
import { MetaApiClient } from '@/lib/meta/client'
import axios from 'axios'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error || !code) {
    return NextResponse.redirect(new URL(`/meta-ads?error=${encodeURIComponent(errorDescription || error || 'no_code')}`, request.url))
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const workspaceId = await getUserWorkspaceId(session.user.id)
  if (!workspaceId) {
    return NextResponse.redirect(new URL('/meta-ads?error=no_workspace', request.url))
  }

  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    return NextResponse.redirect(new URL('/meta-ads?error=meta_not_configured', request.url))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin)
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/meta/callback`

  try {
    // 1. Troca de code por Access Token com a Meta Graph API v21.0
    const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    })

    const accessToken = tokenRes.data?.access_token
    if (!accessToken) {
      return NextResponse.redirect(new URL('/meta-ads?error=token_exchange_failed', request.url))
    }

    // 2. Busca de contas de anúncio vinculadas ao usuário
    const metaClient = new MetaApiClient(accessToken)
    const adAccounts = await metaClient.getAdAccounts()

    // 3. Persistência segura das contas com token cifrado em AES-256-GCM
    const accessTokenEnc = encrypt(accessToken)
    for (const acc of adAccounts) {
      await prisma.adAccount.upsert({
        where: {
          workspaceId_externalId: {
            workspaceId,
            externalId: acc.id,
          },
        },
        update: {
          name: acc.name || acc.id,
          currency: acc.currency || 'BRL',
          timezone: acc.timezone_name || 'America/Sao_Paulo',
          status: 'active',
          accessTokenEnc,
        },
        create: {
          workspaceId,
          externalId: acc.id,
          name: acc.name || acc.id,
          currency: acc.currency || 'BRL',
          timezone: acc.timezone_name || 'America/Sao_Paulo',
          status: 'active',
          accessTokenEnc,
        },
      })
    }

    return NextResponse.redirect(new URL('/meta-ads?success=connected', request.url))
  } catch (err: any) {
    console.error('Meta OAuth callback error:', err?.response?.data || err.message)
    const errDetail = err?.response?.data?.error?.message || err.message || 'unknown'
    return NextResponse.redirect(new URL(`/meta-ads?error=${encodeURIComponent(errDetail)}`, request.url))
  }
}
