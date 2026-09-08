export { auth as proxy, auth as default } from '@/lib/auth'

export const config = {
  matcher: ['/dashboard/:path*', '/meta-ads/:path*', '/utm/:path*', '/integrations/:path*', '/rules/:path*', '/fees/:path*', '/expenses/:path*', '/reports/:path*', '/events/:path*', '/notifications/:path*', '/account/:path*', '/settings/:path*']
}
