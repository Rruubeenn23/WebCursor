import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

const PUBLIC_PATHS = ['/', '/favicon.ico', '/robots.txt']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Sync session
  await supabase.auth.getSession()

  // Protect (app) group routes
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')
  if (!isPublic && pathname.startsWith('/(app)')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
