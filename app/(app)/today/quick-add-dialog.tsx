'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { getCurrentDate } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  userId: string
  onCreated?: () => void
}

export default function QuickAddDialog({ open, onOpenChange, userId, onCreated }: Props) {
  const supabase = createClientComponentClient<Database>()

  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [kcal, setKcal] = useState<string>('')
  const [protein, setProtein] = useState<string>('') // g
  const [carbs, setCarbs] = useState<string>('')     // g
  const [fat, setFat] = useState<string>('')         // g
  const [loading, setLoading] = useState(false)

  const ensureTodayPlan = async (): Promise<string> => {
    const today = getCurrentDate()
    const { data: existing } = await supabase
      .from('day_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()

    if (existing?.id) return existing.id

    const { data: created, error } = await supabase
      .from('day_plans')
      .upsert({ user_id: userId, date: today, training_day: false }, { onConflict: 'user_id,date' })
      .select('id')
      .single()

    if (error) throw error
    return created.id
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kcal) return
    setLoading(true)
    try {
      const planId = await ensureTodayPlan()
      const macros = {
        kcal: Number(kcal) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      }

      const { error } = await supabase
        .from('day_plan_items')
        .insert({
          day_plan_id: planId,
          entry_type: 'quick',
          macros_override: macros as any,
          qty_units: 1,
          time,
          done: false,
        })

      if (error) throw error

      onOpenChange(false)
      onCreated?.()
      setKcal(''); setProtein(''); setCarbs(''); setFat('')
      setTime(new Date().toTimeString().slice(0,5))
    } catch (err) {
      console.error('Quick add error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrada rápida por macros</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Kcal</label>
              <Input type="number" min="0" step="1" placeholder="p. ej. 400" value={kcal} onChange={e => setKcal(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium">Hora</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium">Proteína (g)</label>
              <Input type="number" min="0" step="0.1" placeholder="opcional" value={protein} onChange={e => setProtein(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Carbohidratos (g)</label>
              <Input type="number" min="0" step="0.1" placeholder="opcional" value={carbs} onChange={e => setCarbs(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Grasa (g)</label>
              <Input type="number" min="0" step="0.1" placeholder="opcional" value={fat} onChange={e => setFat(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Añadir'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
