'use client'

import { useState, useTransition } from 'react'
import { createCheckin } from '@/lib/actions/checkins'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewCheckinForm({ defaultWeekStart }: { defaultWeekStart: string }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    week_start: defaultWeekStart,
    weight_kg: '',
    waist_cm: '',
    sleep_h: '',
    hunger_1_5: '',
    energy_1_5: '',
    stress_1_5: '',
    notes: '',
  })

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function submit() {
    startTransition(async () => {
      await createCheckin({
        week_start: form.week_start,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
        sleep_h: form.sleep_h ? Number(form.sleep_h) : null,
        hunger_1_5: form.hunger_1_5 ? Number(form.hunger_1_5) : null,
        energy_1_5: form.energy_1_5 ? Number(form.energy_1_5) : null,
        stress_1_5: form.stress_1_5 ? Number(form.stress_1_5) : null,
        notes: form.notes || null,
      })
      setForm({ ...form, notes: '' })
    })
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={form.week_start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('week_start', e.target.value)} placeholder="YYYY-MM-DD" />
        <Input value={form.weight_kg} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('weight_kg', e.target.value)} placeholder="Peso (kg)" />
        <Input value={form.waist_cm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('waist_cm', e.target.value)} placeholder="Cintura (cm)" />
        <Input value={form.sleep_h} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('sleep_h', e.target.value)} placeholder="Sueño (h)" />
        <Input value={form.hunger_1_5} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('hunger_1_5', e.target.value)} placeholder="Hambre (1-5)" />
        <Input value={form.energy_1_5} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('energy_1_5', e.target.value)} placeholder="Energía (1-5)" />
        <Input value={form.stress_1_5} onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('stress_1_5', e.target.value)} placeholder="Estrés (1-5)" />
      </div>
      <Textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => update('notes', e.target.value)} placeholder="Notas" />
      <Button onClick={submit} disabled={pending}>Guardar check-in</Button>
    </div>
  )
}
