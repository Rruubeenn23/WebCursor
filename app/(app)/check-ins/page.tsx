import { createServerSupabase } from '@/lib/supabase/server'
import NewCheckinForm from './checkin-form'

export default async function CheckInsPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Default week_start = today (you can adjust to real start-of-week later).
  const defaultWeekStart = new Date().toISOString().slice(0, 10)

  const { data } = await (supabase as any)
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(10)

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Check-ins</h1>
      <NewCheckinForm defaultWeekStart={defaultWeekStart} />
      <div className="space-y-2">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className="rounded-md border p-3">
            <div className="font-medium">Semana: {c.week_start}</div>
            <div className="text-sm text-muted-foreground">Peso: {c.weight_kg ?? '—'} kg · Cintura: {c.waist_cm ?? '—'} cm</div>
            <div className="text-sm text-muted-foreground">Sueño: {c.sleep_h ?? '—'} h · Energía: {c.energy_1_5 ?? '—'}/5 · Hambre: {c.hunger_1_5 ?? '—'}/5 · Estrés: {c.stress_1_5 ?? '—'}/5</div>
            {c.notes ? <div className="text-sm mt-1">{c.notes}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
