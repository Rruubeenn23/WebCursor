'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { getCurrentDate } from '@/lib/utils'
import { Check } from 'lucide-react'

interface FoodRow {
  id: string
  name: string
  unit: string
  fav_uses: number | null
  fav_last_used_at: string | null
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  userId: string
  onCreated?: () => void
}

export default function AddFoodDialog({ open, onOpenChange, userId, onCreated }: Props) {
  const supabase = createClientComponentClient<Database>()
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState<FoodRow[]>([])
  const [selectedFood, setSelectedFood] = useState<string>('')
  const [qty, setQty] = useState('1')
  const [time, setTime] = useState(new Date().toTimeString().slice(0,5))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    loadFoods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadFoods = async () => {
    const { data, error } = await supabase
    .from('foods')
    .select(`
        id, name, unit, kcal, protein_g, carbs_g, fat_g,
        food_favorites!left(user_id, uses, last_used_at)
    `)
    .order('uses', { foreignTable: 'food_favorites', ascending: false, nullsFirst: true })
    .order('name', { ascending: true })


    if (error) {
      console.error('Error loading foods:', error)
      return
    }

    const rows: FoodRow[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      unit: r.unit,
      kcal: r.kcal,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
      fav_uses: r.food_favorites?.[0]?.uses ?? null,
      fav_last_used_at: r.food_favorites?.[0]?.last_used_at ?? null,
    }))

    setFoods(rows)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return foods
    return foods.filter(f => f.name.toLowerCase().includes(q))
  }, [foods, query])

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
    if (!selectedFood) return
    setLoading(true)
    try {
      const planId = await ensureTodayPlan()
      const { error } = await supabase
        .from('day_plan_items')
        .insert({
          day_plan_id: planId,
          entry_type: 'food',
          food_id: selectedFood,
          qty_units: Number(qty),
          time,
          done: false
        })

      if (error) throw error

      onOpenChange(false)
      onCreated?.()
      setSelectedFood('')
      setQty('1')
      setTime(new Date().toTimeString().slice(0,5))
    } catch (err) {
      console.error('Add food error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir alimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <Input
            placeholder="Buscar (favoritos primero)…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />

          <div className="max-h-64 overflow-auto space-y-2">
            {filtered.map(f => {
              const selected = selectedFood === f.id
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setSelectedFood(f.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-xl border
                    hover:bg-accent hover:text-accent-foreground
                    transition 
                    ${selected ? 'ring-2 ring-primary border-primary bg-accent/50' : 'border-border'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {f.name} <span className="text-xs text-muted-foreground">({f.unit})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.fav_uses ? <span className="text-xs text-muted-foreground">★ {f.fav_uses}</span> : null}
                      {selected ? <Check className="h-4 w-4" /> : null}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(f.kcal)} kcal • P {f.protein_g}g • C {f.carbs_g}g • G {f.fat_g}g
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground border rounded-xl">Sin resultados</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium">Cantidad</label>
              <Input type="number" min="0.1" step="0.1" value={qty} onChange={e => setQty(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-medium">Hora</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Añadiendo…' : 'Añadir'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
