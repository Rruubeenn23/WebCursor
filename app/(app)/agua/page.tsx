'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type WaterLog = {
  id: string
  ml: number
  logged_at: string
}

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
      .insert({ user_id: user.id, ml })
      .select('id, ml, logged_at')
      .single()

    setLogs((prev) => [...prev, ...(data ? [data as WaterLog] : [])])
    setAmount('')
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
      </CardContent>
    </Card>
  )
}

