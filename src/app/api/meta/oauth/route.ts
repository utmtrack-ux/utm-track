import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getUserWorkspaceId } from '@/lib/workspace'
import { generateOAuthState } from '@/lib/meta/oauth'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const workspaceId = await getUserWorkspaceId(session.user.id)
  if (!workspaceId) {
    return NextResponse.redirect(new URL('/meta-ads?error=no_workspace', request.url))
  }
  
  const appId = process.env.META_APP_ID
  if (!appId) {
    return NextResponse.redirect(
      new URL('/meta-ads?error=meta_app_id_missing', request.url)
    )
  }

  // Derive base URL accurately from request headers, Vercel host, or environment variables
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const originFromReq = host ? `${proto}://${host}` : new URL(request.url).origin

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
    originFromReq

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/meta/callback`
  const state = generateOAuthState(session.user.id, workspaceId)

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'ads_read,read_insights,ads_management,business_management',
    response_type: 'code',
    state,
  })
  
  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`)
}

