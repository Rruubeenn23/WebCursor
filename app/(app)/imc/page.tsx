'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calculateBMI, getBMICategory } from '@/lib/utils'

export default function IMCPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [bmi, setBmi] = useState<number | null>(null)

  const handleCalculate = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    if (isNaN(w) || isNaN(h)) {
      setBmi(null)
      return
    }
    setBmi(calculateBMI(w, h))
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de IMC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Peso (kg)</label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Altura (cm)</label>
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
          </div>
          <Button onClick={handleCalculate}>Calcular</Button>
          {bmi !== null && (
            <div className="mt-4">
              <p className="font-medium">Tu IMC es {bmi}</p>
              <p className="text-sm text-muted-foreground">{getBMICategory(bmi)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
