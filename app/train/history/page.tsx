'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function HistoryPage() {
  const { user, supabase } = useSupabase()
  const [weeks, setWeeks] = useState<any[]>([])
  const [prs, setPrs] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      if (!user) return
      const { data: w } = await supabase
        .from('v_weekly_load')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(12)
      setWeeks(w ?? [])

      const { data: p } = await supabase
        .from('exercise_prs')
        .select('exercise_id, best_est_1rm_kg')
      // trae nombres
      if (p?.length) {
        const exIds = p.map(x => x.exercise_id)
        const { data: ex } = await supabase
          .from('exercises').select('id, name').in('id', exIds)
        const nameMap = new Map((ex??[]).map(e => [e.id, e.name]))
        setPrs(p.map(x => ({ ...x, name: nameMap.get(x.exercise_id) || x.exercise_id })))
      }
    })()
  }, [user, supabase])

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader><CardTitle>Carga semanal</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {weeks.map(w => (
            <div key={w.week_start} className="flex justify-between text-sm border-b py-2">
              <span>{new Date(w.week_start).toLocaleDateString('es-ES')}</span>
              <span>Sesiones: {w.sessions}</span>
              <span>Sets: {w.sets}</span>
              <span>Tonnage: {Number(w.tonnage_kg).toFixed(0)} kg</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>PRs (1RM estimado)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {prs.length ? prs.map(pr => (
            <div key={pr.exercise_id} className="flex justify-between text-sm border-b py-2">
              <span>{pr.name}</span>
              <span>{Number(pr.best_est_1rm_kg).toFixed(1)} kg</span>
            </div>
          )) : <div className="text-sm text-muted-foreground">Aún no hay PRs</div>}
        </CardContent>
      </Card>
    </div>
  )
}
