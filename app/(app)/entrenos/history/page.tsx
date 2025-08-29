'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SessionRow = {
  id: string
  user_id: string
  workout_id: string | null
  created_at: string
  completed_at?: string | null
  workout?: { name: string } | null
}

type PrRow = {
  exercise_id: string
  pr_type: string
  value_numeric: number
  achieved_at: string
  name?: string
}

type ExerciseNameRow = { id: string; name: string }

export default function HistoryEntrenosPage() {
  const { user, supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [prs, setPrs] = useState<PrRow[]>([])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        setLoading(true)

        // Sesiones recientes
        const sResp = await supabase
          .from('workout_sessions')
          .select(`
            id, user_id, workout_id, created_at, completed_at,
            workout:workouts(name)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)

        const sRows: SessionRow[] = (sResp.data as any[] ?? []).map((r) => ({
          id: String(r.id),
          user_id: String(r.user_id),
          workout_id: r.workout_id ? String(r.workout_id) : null,
          created_at: String(r.created_at),
          completed_at: r.completed_at ? String(r.completed_at) : null,
          workout: r.workout ? { name: String(r.workout.name ?? 'Sesión') } : undefined,
        }))
        setSessions(sRows)

        // PRs recientes (si no tienes la tabla, esto quedará vacío)
        const prResp = await supabase
          .from('exercise_prs')
          .select('exercise_id, pr_type, value_numeric, achieved_at')
          .eq('user_id', user.id)
          .order('achieved_at', { ascending: false })
          .limit(20)

        const p: PrRow[] = (prResp.data as any[] ?? []).map((r) => ({
          exercise_id: String(r.exercise_id),
          pr_type: String(r.pr_type),
          value_numeric: Number(r.value_numeric),
          achieved_at: String(r.achieved_at),
        }))

        if (p.length) {
          const exIds = Array.from(new Set(p.map((x) => x.exercise_id).filter(Boolean)))
          if (exIds.length) {
            const exResp = await supabase
              .from('exercises')
              .select('id, name')
              .in('id', exIds)

            const exRows: ExerciseNameRow[] = (exResp.data as any[] ?? []).map((e) => ({
              id: String(e.id),
              name: String(e.name),
            }))
            const nameMap = new Map(exRows.map((e) => [e.id, e.name]))

            setPrs(
              p.map((x) => ({
                ...x,
                name: nameMap.get(x.exercise_id) ?? x.exercise_id,
              }))
            )
          } else {
            setPrs(p)
          }
        } else {
          setPrs([])
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [user, supabase])

  if (loading) return <div className="p-4">Cargando…</div>

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesiones */}
        <Card>
          <CardHeader>
            <CardTitle>Sesiones recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin sesiones todavía.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-medium">{s.workout?.name ?? 'Sesión'}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(s.created_at).toLocaleString('es-ES')}
                        {s.completed_at
                          ? ` · fin: ${new Date(s.completed_at).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : ''}
                      </div>
                    </div>
                    <Link href={`/entrenos/log/${s.id}`} className="text-sm underline underline-offset-4">
                      Ver sesión
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* PRs */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos PRs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {prs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin PRs todavía.</p>
            ) : (
              <ul className="space-y-2">
                {prs.map((p, i) => (
                  <li key={`${p.exercise_id}-${p.achieved_at}-${i}`} className="rounded-md border p-3">
                    <div className="font-medium">{p.name ?? p.exercise_id}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.pr_type}:{' '}
                      <span className="font-medium">{Number.isFinite(p.value_numeric) ? p.value_numeric : '-'}</span>{' '}
                      · {new Date(p.achieved_at).toLocaleDateString('es-ES')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
