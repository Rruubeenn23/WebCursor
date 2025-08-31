'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Tables, TablesInsert } from '@/types/database'

type WaterLog = Tables<'water_logs'>

export default function AguaPage() {
  const { user, supabase } = useSupabase()
  const [amount, setAmount] = useState('')
  const [logs, setLogs] = useState<WaterLog[]>([])

  const dailyTotal = logs.reduce((acc, l) => acc + l.ml, 0)
  const goal = 2000

  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('water_logs')
        .select('id, ml, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .order('logged_at', { ascending: true })

      setLogs((data as WaterLog[]) ?? [])
    }

    fetchLogs()
  }, [supabase, user])

  const addLog = async () => {
    const ml = parseInt(amount, 10)
    if (!ml || !user) return

    const { data } = await supabase
      .from('water_logs')
      .insert({ user_id: user.id, ml } as TablesInsert<'water_logs'>)
      .select('id, ml, logged_at')
      .single()

    if (data) setLogs((prev) => [...prev, data as WaterLog])
    setAmount('')
  }

  const removeLog = async (id: string) => {
    await supabase.from('water_logs').delete().eq('id', id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registro de Agua</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="ml"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={addLog} disabled={!amount}>
            Añadir
          </Button>
        </div>
        <div>
          <p className="text-sm mb-2">
            Total diario: {dailyTotal} / {goal} ml
          </p>
          <Progress value={Math.min(100, (dailyTotal / goal) * 100)} />
        </div>

        {logs.length > 0 && (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between text-sm">
                <span>
                  {format(new Date(log.logged_at), 'HH:mm')} - {log.ml} ml
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeLog(log.id)}
                  aria-label="Eliminar registro"
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

