// app/onboarding/complete/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(req: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr) {
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // (Optional) You can accept extra fields from the form and store them in metadata too
  let payload: Record<string, any> = {}
  try {
    payload = await req.json()
  } catch {
    // ignore body parse errors; payload stays empty
  }

  const metadata = {
    ...user.user_metadata,
    ...payload, // e.g., { name, goal }
    onboarding_completed: true,
  }

  const { error: updErr } = await supabase.auth.updateUser({ data: metadata })
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Cookie fallback so middleware can also rely on it
  cookieStore.set('onboarding_complete', 'true', {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  })

  return NextResponse.json({ ok: true })
}
