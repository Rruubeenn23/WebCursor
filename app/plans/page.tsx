import { createServerSupabase } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function formatISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfDayUTC(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export default async function PlansPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Show plans for the next 14 days
  const today = startOfDayUTC(new Date())
  const end = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('day_plans')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', formatISO(today))
    .lte('date', formatISO(end))
    .order('date', { ascending: true })

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Plan semanal</h1>
        <p className="text-sm text-red-600">Error cargando planes: {error.message}</p>
      </div>
    )
  }

  const plans = data ?? []

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Plan semanal</h1>

      <Card>
        <CardHeader>
          <CardTitle>Próximos 14 días</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay planes. Usa el botón de “Generar semana” para crear uno nuevo.
            </div>
          ) : (
            <ul className="space-y-2">
              {plans.map((p: any) => (
                <li key={p.id} className="rounded-md border p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.date}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.training_day ? 'Día de entreno' : 'Día de descanso'} {p.notes ? `· ${p.notes}` : ''}
                    </div>
                  </div>
                  {/* You can add actions here (edit, open, etc.) */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
