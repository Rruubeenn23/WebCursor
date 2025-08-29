'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function startOfWeek(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 // semana empieza lunes
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}
function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Daily = {
  day: string
  kcal_done: number | null
  protein_done: number | null
  carbs_done: number | null
  fat_done: number | null
}

export default function HistorialPage() {
  const { user, supabase } = useSupabase()
  const [weekStart, setWeekStart] = useState(formatDateISO(startOfWeek()))
  const [weekData, setWeekData] = useState<Daily[]>([])
  const [adherence, setAdherence] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart); d.setDate(d.getDate() + 6); return formatDateISO(d)
  }, [weekStart])

  useEffect(() => {
    if (!user) return
    loadWeek()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, weekStart])

  const loadWeek = async () => {
    if (!user) return
    setLoading(true)
    // Totales
    const { data: totals } = await supabase
      .from('v_daily_totals')
      .select('*')
      .eq('user_id', user.id)
      .gte('day', weekStart)
      .lte('day', weekEnd)
      .order('day')

    // Adherencia
    const { data: adh } = await supabase.rpc('adherence_weekly', {
      p_user_id: user.id,
      p_week_start: weekStart
    } as any)

    setWeekData((totals as Daily[]) ?? [])
    setAdherence(adh)
    setLoading(false)
  }

  const exportCSV = () => {
    const rows = weekData.map(d => ({
      day: d.day,
      kcal: d.kcal_done ?? 0,
      protein: d.protein_done ?? 0,
      carbs: d.carbs_done ?? 0,
      fat: d.fat_done ?? 0,
    }))
    const csv = [
      'day,kcal,protein,carbs,fat',
      ...rows.map(r => `${r.day},${r.kcal},${r.protein},${r.carbs},${r.fat}`)
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial_${weekStart}_${weekEnd}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial</h1>
          <p className="text-muted-foreground">Resumen de la semana</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="w-[160px]"
          />
          <Button onClick={exportCSV}>Exportar CSV</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Totales (hecho)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Cargando…</div>
          ) : weekData.length === 0 ? (
            <div className="text-muted-foreground">Sin datos para esta semana</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Día</th>
                    <th className="text-right">Kcal</th>
                    <th className="text-right">Prot</th>
                    <th className="text-right">Carbs</th>
                    <th className="text-right">Grasa</th>
                  </tr>
                </thead>
                <tbody>
                  {weekData.map((d) => (
                    <tr key={d.day} className="border-t">
                      <td className="py-2">{new Date(d.day).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                      <td className="text-right">{d.kcal_done ?? 0}</td>
                      <td className="text-right">{d.protein_done ?? 0}</td>
                      <td className="text-right">{d.carbs_done ?? 0}</td>
                      <td className="text-right">{d.fat_done ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Adherencia</CardTitle>
        </CardHeader>
        <CardContent>
          {adherence && Array.isArray(adherence) && adherence.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">Items planificados</div>
                <div className="text-xl font-semibold">{adherence[0].planned_items ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">Items hechos</div>
                <div className="text-xl font-semibold">{adherence[0].done_items ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">% de adherencia</div>
                <div className="text-xl font-semibold">
                  {adherence[0].percent_done != null ? `${adherence[0].percent_done}%` : '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">Δ kcal media</div>
                <div className="text-xl font-semibold">
                  {adherence[0].kcal_avg_delta != null ? adherence[0].kcal_avg_delta : '—'}
                </div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">Días OK en proteína</div>
                <div className="text-xl font-semibold">{adherence[0].protein_days_ok ?? 0}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-muted-foreground">Días registrados</div>
                <div className="text-xl font-semibold">{adherence[0].days_logged ?? 0}</div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Sin datos de adherencia para esta semana</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
