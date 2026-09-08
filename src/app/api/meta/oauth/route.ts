import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getUserWorkspaceId } from '@/lib/workspace'
import { generateOAuthState, getMetaRedirectUri } from '@/lib/meta/oauth'

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

  const redirectUri = getMetaRedirectUri(request)
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


