'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Database } from '@/types/database'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
interface Food {
  id: string
  name: string
  unit: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
  grams_per_unit: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMeal: (foodId: string, qtyUnits: number, time: string) => Promise<void>
  planId: string
}

export function AddMealDialog({ open, onOpenChange, onAddMeal, planId }: Props) {
  const [foods, setFoods] = useState<Food[]>([])
  const [selectedFood, setSelectedFood] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5))
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadFoods()
  }, [])

  const loadFoods = async () => {
    try {
      const { data: foodsData } = await supabase
        .from('foods')
        .select('*')
        .order('name')

      setFoods(foodsData || [])
    } catch (error) {
      console.error('Error loading foods:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFood || !quantity || !time) return

    setLoading(true)
    try {
      await onAddMeal(selectedFood, Number(quantity), time)
      onOpenChange(false)
      setSelectedFood('')
      setQuantity('1')
      setTime(new Date().toTimeString().slice(0, 5))
    } catch (error) {
      console.error('Error adding meal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Comida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Alimento</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedFood}
              onChange={(e) => setSelectedFood(e.target.value)}
              required
            >
              <option value="">Selecciona un alimento</option>
              {foods.map((food) => (
                <option key={food.id} value={food.id}>
                  {food.name} ({food.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hora</label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
