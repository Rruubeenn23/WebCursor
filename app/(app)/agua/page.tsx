import { createServerSupabase } from '@/lib/supabase/server'
import { WaterQuickAdd } from '../today/water-quick-add'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TZ } from '@/lib/utils'

function todayWindow(tz = TZ) {
  const now = new Date()
  const y = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(now)
  const m = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(now)
  const d = new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit' }).format(now)
  const start = new Date(`${y}-${m}-${d}T00:00:00.000Z`)
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { startISO: start.toISOString(), endISO: end.toISOString(), label: `${y}-${m}-${d}` }
}

export default async function AguaPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { startISO, endISO, label } = todayWindow(TZ)

  const { data } = await supabase
    .from('water_logs')
    .select('amount_ml, created_at')
    .eq('user_id', user.id)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .returns<{ amount_ml: number; created_at: string }[]>()

  const total = (data ?? []).reduce((s, r) => s + (r?.amount_ml ?? 0), 0)

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Agua</h1>
      <Card>
        <CardHeader>
          <CardTitle>Hoy ({label})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>Total: <span className="font-semibold">{total} ml</span></div>
          <WaterQuickAdd />
          <div className="pt-2">
            <ul className="space-y-1">
              {(data ?? []).map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground">{r.amount_ml} ml</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
