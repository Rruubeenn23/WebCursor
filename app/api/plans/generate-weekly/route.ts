import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMealPlanService } from '@/lib/services/mealPlanService'

export async function POST() {
  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()

  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const svc = getMealPlanService(supabase)
    await svc.generateWeek(user.id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed to generate week' }, { status: 500 })
  }
}
