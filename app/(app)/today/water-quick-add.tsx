'use client'

import { useState, useTransition } from 'react'
import { addWater } from '@/lib/actions/water'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function WaterQuickAdd() {
  const [ml, setMl] = useState<number>(250)
  const [pending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      await addWater({ ml })
      setMl(250)
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        max={5000}
        value={ml}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMl(Number(e.target.value))}
        className="w-28"
      />
      <Button onClick={submit} disabled={pending}>Añadir</Button>
    </div>
  )
}
