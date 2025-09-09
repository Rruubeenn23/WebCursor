import { createServerSupabase } from '@/lib/supabase/server'
import { TZ } from '@/lib/utils'

function todayRangeTZ(tz = TZ) {
  // Build [start, end) ISO timestamps for today in tz
  const now = new Date()
  const fmt = (d: Date) => d.toISOString()
  const start = new Date(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(now) + '-' +
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(now) + '-' +
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit' }).format(now) + 'T00:00:00.000Z'
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { startISO: fmt(start), endISO: fmt(end) }
}

export async function getTodaySummary(): Promise<{
  user: { id: string; email?: string | null } | null
  date: string
  water_ml: number
  workouts: any[]
  meals: any[]
}> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  // date label in YYYY-MM-DD (local tz)
  const now = new Date()
  const dateLabel = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const { startISO, endISO } = todayRangeTZ(TZ)

  if (!user) {
    return { user: null, date: dateLabel, water_ml: 0, workouts: [], meals: [] }
  }

  // water_logs has amount_ml and created_at
  const { data: water } = await supabase
    .from('water_logs')
    .select('amount_ml, created_at')
    .eq('user_id', user.id)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .returns<{ amount_ml: number; created_at: string }[]>()

  const water_ml = (water ?? []).reduce((sum, w) => sum + (w?.amount_ml ?? 0), 0)

  // If your DB currently lacks workouts & meals in the types, return empty arrays safely.
  // You can wire these once your types include the tables.
  const workouts: any[] = []
  const meals: any[] = []

  return {
    user: { id: user.id, email: user.email },
    date: dateLabel,
    water_ml,
    workouts,
    meals,
  }
}
