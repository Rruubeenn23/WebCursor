'use client'

import { useState, useTransition } from 'react'
import { createWorkout } from '@/lib/actions/workouts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function NewWorkoutForm({ defaultDate }: { defaultDate: string }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState<string>('')
  const [date, setDate] = useState<string>(defaultDate)

  function submit() {
    startTransition(async () => {
      await createWorkout({ name, date })
      setName('')
    })
  }

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Nombre del entreno" />
        <Input value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
      </div>
      <Button onClick={submit} disabled={pending || !name}>Crear entreno</Button>
    </div>
  )
}
