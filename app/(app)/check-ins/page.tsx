'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getWeekStart(d = new Date()) {
  // Lunes como inicio de semana (ISO)
  const day = d.getDay() || 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  monday.setHours(0,0,0,0)
  // YYYY-MM-DD
  return new Date(monday.getTime() - monday.getTimezoneOffset()*60000).toISOString().slice(0,10)
}

export default function CheckInsPage() {
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [sleep, setSleep] = useState('')
  const [hunger, setHunger] = useState('')
  const [energy, setEnergy] = useState('')
  const [stress, setStress] = useState('')
  const [notes, setNotes] = useState('')

  const [adherence, setAdherence] = useState<{
    planned_items: number
    done_items: number
    percent_done: number | null
    kcal_avg_delta: number | null
    protein_days_ok: number
    days_logged: number
  } | null>(null)

  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    setLoading(false)
    // cargar historia breve
    loadHistory()
    // cargar adherencia de la semana actual
    loadAdherence(weekStart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadHistory = async () => {
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(8)
    setHistory(data || [])
  }

  const loadAdherence = async (ws: string) => {
    if (!user) return
    const { data, error } = await supabase.rpc(
    'adherence_weekly',
    {
        p_user_id: user.id,
        p_week_start: ws
    } as any 
    )

    if (error) {
      console.error('adherence_weekly error', error)
      setAdherence(null)
      return
    }
    setAdherence(data?.[0] ?? null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const payload = {
      user_id: user.id,
      week_start: weekStart,
      weight_kg: weight ? Number(weight) : null,
      waist_cm: waist ? Number(waist) : null,
      sleep_h: sleep ? Number(sleep) : null,
      hunger_1_5: hunger ? Number(hunger) : null,
      energy_1_5: energy ? Number(energy) : null,
      stress_1_5: stress ? Number(stress) : null,
      notes: notes || null
    }
    const { error } = await supabase
      .from('checkins')
      .upsert(payload as any, { onConflict: 'user_id,week_start' })
    if (error) {
      console.error('checkin upsert error', error)
      return
    }
    await loadHistory()
    await loadAdherence(weekStart)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-in semanal</h1>
          <p className="text-muted-foreground text-sm">Registra tus métricas y visualiza tu adherencia.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium">Semana (lunes)</label>
              <Input type="date" value={weekStart} onChange={e => { setWeekStart(e.target.value); loadAdherence(e.target.value) }} />
            </div>
            <div>
              <label className="text-xs font-medium">Peso (kg)</label>
              <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Cintura (cm)</label>
              <Input type="number" step="0.1" value={waist} onChange={e => setWaist(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Sueño (h)</label>
              <Input type="number" step="0.1" value={sleep} onChange={e => setSleep(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Hambre (1-5)</label>
              <Input type="number" min="1" max="5" value={hunger} onChange={e => setHunger(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Energía (1-5)</label>
              <Input type="number" min="1" max="5" value={energy} onChange={e => setEnergy(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Estrés (1-5)</label>
              <Input type="number" min="1" max="5" value={stress} onChange={e => setStress(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-medium">Notas</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Adherencia de la semana</CardTitle></CardHeader>
          <CardContent>
            {adherence ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Items hechos</div>
                  <div className="text-xl font-semibold">{adherence.done_items}/{adherence.planned_items}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">% Adherencia</div>
                  <div className="text-xl font-semibold">{adherence.percent_done ?? 0}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Δ kcal media</div>
                  <div className="text-xl font-semibold">{adherence.kcal_avg_delta ?? 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Días prot OK</div>
                  <div className="text-xl font-semibold">{adherence.protein_days_ok}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Días con log</div>
                  <div className="text-xl font-semibold">{adherence.days_logged}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Sin datos para esa semana.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historial reciente</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">Semana {new Date(c.week_start).toLocaleDateString('es-ES')}</div>
                    <div className="text-muted-foreground">Peso: {c.weight_kg ?? '—'} kg • Cintura: {c.waist_cm ?? '—'} cm</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('es-ES')}</div>
                </div>
              ))}
              {history.length === 0 && <div className="text-muted-foreground">Aún no hay check-ins.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
