'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calculateBMR, calculateTDEE, ActivityLevel } from '@/lib/utils'

export default function BMRPage() {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [activity, setActivity] = useState<ActivityLevel>('sedentary')
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null)

  const handleCalculate = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    if (isNaN(w) || isNaN(h) || isNaN(a)) {
      setResult(null)
      return
    }
    const bmr = calculateBMR({ weightKg: w, heightCm: h, age: a, sex })
    const tdee = calculateTDEE(bmr, activity)
    setResult({ bmr, tdee })
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de BMR/TDEE</CardTitle>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Edad</label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sexo</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={sex}
              onChange={(e) => setSex(e.target.value as 'male' | 'female')}
            >
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Actividad</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            >
              <option value="sedentary">Sedentario</option>
              <option value="light">Ligera</option>
              <option value="moderate">Moderada</option>
              <option value="active">Activa</option>
              <option value="veryActive">Muy activa</option>
            </select>
          </div>
          <Button onClick={handleCalculate}>Calcular</Button>
          {result && (
            <div className="mt-4">
              <p className="font-medium">BMR: {result.bmr} kcal/día</p>
              <p className="text-sm text-muted-foreground">TDEE: {result.tdee} kcal/día</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
