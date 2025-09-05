'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { Database } from '@/types/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Template {
  id: string
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: string           // fecha para el day_plan (YYYY-MM-DD)
  userId: string         // id del usuario autenticado
  onCreated?: () => void // callback opcional para recargar desde el padre
}

export function AddMealDialog({ open, onOpenChange, date, userId, onCreated }: Props) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notes, setNotes] = useState('')
  const [trainingDay, setTrainingDay] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (!open) return
    loadTemplates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_templates')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('day_plans')
        .insert({
          user_id: userId,
          date,
          training_day: trainingDay,
          notes: notes || null,
          template_id: selectedTemplate
        })

      if (error) throw error

      onOpenChange(false)
      onCreated?.()
      // Reset campos
      setSelectedTemplate('')
      setNotes('')
      setTrainingDay(false)
    } catch (error) {
      console.error('Error creating day plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Plan de Comida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plantilla</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              required
            >
              <option value="">Selecciona una plantilla</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional (p.ej. cardio 30min)"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de día</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={trainingDay ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTrainingDay(true)}
                className="flex-1"
              >
                Entrenamiento
              </Button>
              <Button
                type="button"
                variant={!trainingDay ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTrainingDay(false)}
                className="flex-1"
              >
                Descanso
              </Button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
