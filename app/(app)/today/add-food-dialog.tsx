'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type FoodRow = { id: string; name: string; unit: string | null }

interface Food {
  id: string
  name: string
  unit: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMeal: (foodId: string, qtyUnits: number, time: string) => Promise<void>
}

export default function AddFoodDialog({
  open,
  onOpenChange,
  onAddMeal,
}: Props) {
  const { user, supabase } = useSupabase()
  const [foods, setFoods] = useState<Food[]>([])
  const [recents, setRecents] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const selectedUnit = useMemo(() => {
    const f = foods.find((x) => x.id === selectedFood)
    return f?.unit || ''
  }, [foods, selectedFood])

  useEffect(() => {
    if (!open) {
      // reset cuando se cierra
      setSelectedFood('')
      setQuantity('1')
      setTime(new Date().toTimeString().slice(0, 5))
      setError(null)
      setSearch('')
      return
    }
    ;(async () => {
      try {
        // 1) catálogo foods
        const { data: foodsData, error: foodsErr } = await supabase
          .from('foods')
          .select('id, name, unit')
          .order('name', { ascending: true })

        if (foodsErr) throw foodsErr
        setFoods((foodsData as FoodRow[]).map((f) => ({
          id: String(f.id),
          name: String(f.name),
          unit: String(f.unit ?? ''),
        })))

        // 2) recientes (vista) por usuario
        if (user) {
          const { data: rdata, error: rerr } = await supabase
            .from('v_food_recent')
            .select('food_id, name, unit, last_used_at')
            .eq('user_id', user.id)
            .order('last_used_at', { ascending: false })
            .limit(8)

          if (!rerr) {
            setRecents(
              (rdata ?? []).map((r: any) => ({
                id: String(r.food_id),
                name: String(r.name),
                unit: String(r.unit ?? ''),
              }))
            )
          }
        }
      } catch (e: any) {
        console.error('Error loading foods/recents:', e)
        setError('No se pudieron cargar los alimentos.')
      }
    })()
  }, [open, supabase, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFood || !quantity || !time) return
    setLoading(true)
    setError(null)
    try {
      await onAddMeal(selectedFood, Number(quantity), time)
      onOpenChange(false)
      // reset tras añadir
      setSelectedFood('')
      setQuantity('1')
      setTime(new Date().toTimeString().slice(0, 5))
    } catch (e: any) {
      console.error('Error adding meal:', e)
      setError('No se pudo añadir la comida.')
    } finally {
      setLoading(false)
    }
  }

  const filteredFoods = useMemo(() => {
    if (!search.trim()) return foods
    const q = search.toLowerCase()
    return foods.filter(
      (f) => f.name.toLowerCase().includes(q) || f.unit.toLowerCase().includes(q)
    )
  }, [foods, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Comida</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Recientes */}
          {recents.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Recientes</label>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedFood(r.id)}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors hover:bg-accent ${
                      selectedFood === r.id ? 'bg-accent' : ''
                    }`}
                    title={r.name}
                  >
                    {r.name}{' '}
                    <span className="text-muted-foreground">
                      ({r.unit || 'ud'})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Buscador */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Buscar</label>
            <Input
              placeholder="Ej: Arroz, Pollo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Select alimento */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Alimento</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedFood}
              onChange={(e) => setSelectedFood(e.target.value)}
              required
            >
              <option value="">Selecciona un alimento</option>
              {filteredFoods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name} {food.unit ? `(${food.unit})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Cantidad {selectedUnit ? `(${selectedUnit})` : ''}
            </label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          {/* Hora */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hora</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedFood}>
              {loading ? 'Añadiendo…' : 'Añadir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
