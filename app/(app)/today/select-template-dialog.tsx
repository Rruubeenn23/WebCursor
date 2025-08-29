'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrentDate } from '@/lib/utils'

type Template = { id: string; name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplied?: (planId?: string) => void
  defaultDate?: string // yyyy-mm-dd (por defecto: hoy)
}

export default function SelectTemplateDialog({ open, onOpenChange, onApplied, defaultDate }: Props) {
  const { user, supabase } = useSupabase()
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateId, setTemplateId] = useState('')
  const [date, setDate] = useState(defaultDate || getCurrentDate())
  const [strategy, setStrategy] = useState<'keep' | 'spread'>('keep')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('meal_templates')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (!error) setTemplates((data as Template[]) ?? [])
    })()
  }, [user, supabase, open])

  useEffect(() => {
    if (!open) {
      setTemplateId('')
      setDate(defaultDate || getCurrentDate())
      setStrategy('keep')
      setError(null)
      setLoading(false)
    }
  }, [open, defaultDate])

  const applyTemplate = async () => {
    if (!user || !templateId || !date) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('apply_meal_template', {
      p_user_id: user.id,
      p_template_id: templateId,
      p_date: date,
      p_time_strategy: strategy,
    }as any)
    setLoading(false)
    if (error) {
      console.error('apply_meal_template error', error)
      setError(error.message || 'Error aplicando plantilla')
      return
    }
    onOpenChange(false)
    onApplied?.(data as string | undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar plantilla</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Plantilla</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Selecciona una plantilla…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Horas</label>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="timeStrategy"
                  checked={strategy === 'keep'}
                  onChange={() => setStrategy('keep')}
                />
                Mantener horas de la plantilla
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="timeStrategy"
                  checked={strategy === 'spread'}
                  onChange={() => setStrategy('spread')}
                />
                Repartir (cada 2h desde 08:00)
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={applyTemplate} disabled={!templateId || !date || loading}>
              {loading ? 'Aplicando…' : 'Aplicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
