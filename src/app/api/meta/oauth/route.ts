import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })
  
  const appId = process.env.META_APP_ID
  if (!appId) return new NextResponse(JSON.stringify({ error: 'META_APP_ID not configured' }), { status: 500, headers: {'Content-Type': 'application/json'} })
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : new URL(request.url).origin)
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/meta/callback`

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'ads_read,ads_management,business_management,read_insights',
    response_type: 'code',
    state: 'workspace_oauth'
  })
  
  return NextResponse.redirect(`https://www.facebook.com/v21.0/dialog/oauth?${params}`)
}
