import { getTodaySummary } from '@/lib/queries/today'
import { WaterQuickAdd } from './water-quick-add'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TodayPage() {
  const { date, water_ml, workouts, meals } = await getTodaySummary()

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Hoy</h1>

      <Card>
        <CardHeader>
          <CardTitle>Agua</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">Fecha: {date}</div>
          <div className="text-lg">Total: <span className="font-semibold">{water_ml} ml</span></div>
          <WaterQuickAdd />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comidas de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay comidas planificadas.</div>
          ) : (
            <ul className="space-y-2">
              {meals.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <div className="font-medium">{m.food?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.qty_units} {m.unit ?? 'u'} · {m.food?.kcal} kcal
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{m.time_hint ?? ''}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrenos de hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay entrenos para hoy.</div>
          ) : (
            <ul className="space-y-2">
              {workouts.map((w: any) => (
                <li key={w.id} className="rounded-md border p-2">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">{w.date}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
