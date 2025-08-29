'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SetDraft = {
  exercise_id: string
  set_index: number
  weight_kg?: number
  reps?: number
  rir?: number
  is_warmup?: boolean
  is_backoff?: boolean
}

type WorkoutExerciseTemplate = {
  exercise_id: string
  sets: number | null
  reps: number | null
  rir: number | null
  rest_seconds: number | null
}

type SessionWithWorkout = {
  id: string
  workout_id: string | null
  workout: {
    id: string
    exercises: WorkoutExerciseTemplate[]
  } | null
}

export default function SessionLogPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user, supabase } = useSupabase()
  const router = useRouter()
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<SetDraft[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      if (!user) return
      setLoading(true)

      // catálogo de ejercicios
      const { data: ex } = await supabase
        .from('exercises')
        .select('id, name')
        .order('name', { ascending: true })
      setExercises((ex as any[] ?? []).map(e => ({ id: String(e.id), name: String(e.name) })))

      // sesión + rutina (si existe)
      const { data: sessRaw } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          workout_id,
          workout:workouts(
            id,
            exercises:workout_exercises(
              exercise_id, sets, reps, rir, rest_seconds
            )
          )
        `)
        .eq('id', sessionId)
        .maybeSingle()

      const sess = (sessRaw as unknown) as SessionWithWorkout | null
      const wex = (sess?.workout?.exercises ?? []) as WorkoutExerciseTemplate[]

      if (wex.length) {
        const draft: SetDraft[] = []
        for (const we of wex) {
          const totalSets = Number(we.sets ?? 3)
          for (let i = 1; i <= totalSets; i++) {
            draft.push({
              exercise_id: String(we.exercise_id),
              set_index: i,
              reps: we.reps ?? undefined,
              rir: we.rir ?? undefined,
            })
          }
        }
        setRows(draft)
      }

      setLoading(false)
    })()
  }, [user, sessionId, supabase])

  const addEmptyRow = () => {
    setRows(r => {
      const lastIndexForEmpty = r.slice().reverse().find(x => !x.exercise_id)?.set_index ?? 0
      return [...r, { exercise_id: '', set_index: lastIndexForEmpty + 1 }]
    })
  }

  const saveAll = async () => {
    if (!user) return
    const payload = rows
      .filter(r => r.exercise_id && r.set_index)
      .map(r => ({
        session_id: sessionId,
        exercise_id: r.exercise_id,
        set_index: r.set_index,
        weight_kg: r.weight_kg ?? null,
        reps: r.reps ?? null,
        rir: r.rir ?? null,
        is_warmup: r.is_warmup ?? false,
        is_backoff: r.is_backoff ?? false,
      }))

    if (!payload.length) return

    const { error } = await (supabase as any)
      .from('session_sets')
      .insert(payload)

    if (error) {
      console.error('save sets error', error)
      return
    }

    // marcar fin de sesión (ajusta si tu columna se llama distinto)
    await (supabase as any)
      .from('workout_sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', sessionId)

    router.push('/entrenos/history')
  }

  if (loading) return <div className="p-4">Cargando…</div>

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registro de sesión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <select
                  className="w-full border rounded p-2"
                  value={r.exercise_id}
                  onChange={e => {
                    const v = e.target.value
                    setRows(prev => prev.map((x, idx) => idx === i ? { ...x, exercise_id: v } : x))
                  }}
                >
                  <option value="">Ejercicio…</option>
                  {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Peso (kg)"
                  value={r.weight_kg ?? ''}
                  onChange={e => {
                    const v = e.target.value ? Number(e.target.value) : undefined
                    setRows(prev => prev.map((x, idx) => idx === i ? { ...x, weight_kg: v } : x))
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="Reps"
                  value={r.reps ?? ''}
                  onChange={e => {
                    const v = e.target.value ? Number(e.target.value) : undefined
                    setRows(prev => prev.map((x, idx) => idx === i ? { ...x, reps: v } : x))
                  }}
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  placeholder="RIR"
                  value={r.rir ?? ''}
                  onChange={e => {
                    const v = e.target.value ? Number(e.target.value) : undefined
                    setRows(prev => prev.map((x, idx) => idx === i ? { ...x, rir: v } : x))
                  }}
                />
              </div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" size="sm" onClick={() => setRows(prev => prev.filter((_, idx) => idx !== i))}>✕</Button>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={addEmptyRow}>Añadir set</Button>
            <Button onClick={saveAll}>Guardar sesión</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
