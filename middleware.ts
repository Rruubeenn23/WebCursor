// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const DASHBOARD_PATH = '/'

const PUBLIC_PATHS = [
  '/',                 // landing
  '/auth',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/onboarding',       // onboarding itself must be reachable
]

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const res = NextResponse.next()

  if (isPublicPath(pathname)) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not signed in → let route-level guards handle it
  if (!user) {
    return res
  }

  // Onboarding is now inside Ajustes; no redirect logic here.
  const completedViaMetadata =
    user.user_metadata?.onboarding_completed === true ||
    user.user_metadata?.onboarding_completed === 'true'

  const completedViaCookie =
    req.cookies.get('onboarding_complete')?.value === 'true'

  const hasCompleted = completedViaMetadata || completedViaCookie

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|static|images).*)',
  ],
}
