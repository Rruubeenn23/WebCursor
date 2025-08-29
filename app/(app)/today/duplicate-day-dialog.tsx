'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCurrentDate } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetDate?: string // destino (por defecto: hoy)
  onCopied?: (planId?: string) => void
}

export default function DuplicateDayDialog({ open, onOpenChange, targetDate, onCopied }: Props) {
  const { user, supabase } = useSupabase()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(targetDate || getCurrentDate())
  const [keepTimes, setKeepTimes] = useState(true)
  const [keepDone, setKeepDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFromDate('')
      setToDate(targetDate || getCurrentDate())
      setKeepTimes(true)
      setKeepDone(false)
      setError(null)
      setLoading(false)
    }
  }, [open, targetDate])

  const copyDay = async () => {
    if (!user || !fromDate || !toDate) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('copy_day_plan', {
      p_user_id: user.id,
      p_from: fromDate,
      p_to: toDate,
      p_keep_times: keepTimes,
      p_keep_done: keepDone,
    } as any ) 
    setLoading(false)
    if (error) {
      console.error('copy_day_plan error', error)
      setError(error.message || 'No se pudo duplicar el día')
      return
    }
    onOpenChange(false)
    onCopied?.(data as string | undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar día</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Desde</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Hasta</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={keepTimes} onChange={(e) => setKeepTimes(e.target.checked)} />
              Mantener horas
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={keepDone} onChange={(e) => setKeepDone(e.target.checked)} />
              Mantener completado (done)
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={copyDay} disabled={!fromDate || !toDate || loading}>
              {loading ? 'Duplicando…' : 'Duplicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
