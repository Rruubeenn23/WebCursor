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
  if (PUBLIC_PATHS.includes(pathname)) return true
  return (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // files like /robots.txt, /sitemap.xml, /images/*.png
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Create a response we can mutate (supabase will refresh cookies here)
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get current user (fast; uses auth cookies)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not signed in → let route-level guards handle it
  if (!user) {
    return res
  }

  // Determine onboarding completion
  const completedViaMetadata =
    user.user_metadata?.onboarding_completed === true ||
    user.user_metadata?.onboarding_completed === 'true'

  const completedViaCookie =
    req.cookies.get('onboarding_complete')?.value === 'true'

  const hasCompleted = completedViaMetadata || completedViaCookie

  // Force onboarding if not completed
  if (!hasCompleted && !pathname.startsWith('/onboarding')) {
    const url = req.nextUrl.clone()
    url.pathname = '/onboarding'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Keep completed users out of /onboarding
  if (hasCompleted && pathname.startsWith('/onboarding')) {
    const url = req.nextUrl.clone()
    url.pathname = DASHBOARD_PATH
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets|static|images).*)',
  ],
}
