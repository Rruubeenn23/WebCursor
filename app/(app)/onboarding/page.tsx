'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { computeAndSaveTargets } from '@/lib/actions/goals'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function OnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  // We’ll let the server action redirect on success; client only shows local errors
  const action = async (formData: FormData) => {
    setError(null)
    try {
      await computeAndSaveTargets(formData)
    } catch (e: any) {
      setError(e?.message ?? 'Algo ha fallado')
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tu plan de objetivos</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sex">Sexo</Label>
                <Select name="sex" defaultValue="male">
                  <SelectTrigger id="sex">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Hombre</SelectItem>
                    <SelectItem value="female">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input id="age" name="age" type="number" min={14} max={100} defaultValue={28} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height_cm">Altura (cm)</Label>
                <Input id="height_cm" name="height_cm" type="number" min={120} max={250} defaultValue={175} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input id="weight_kg" name="weight_kg" type="number" step="0.1" min={35} max={300} defaultValue={75} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Actividad</Label>
                <Select name="activity" defaultValue="moderate">
                  <SelectTrigger id="activity">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentario</SelectItem>
                    <SelectItem value="light">Ligera</SelectItem>
                    <SelectItem value="moderate">Moderada</SelectItem>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="very_active">Muy activa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Select name="goal" defaultValue="cut">
                  <SelectTrigger id="goal">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cut">Definición (perder)</SelectItem>
                    <SelectItem value="maintain">Mantener</SelectItem>
                    <SelectItem value="bulk">Volumen (ganar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="rate_kg_per_week">Ritmo (kg por semana)</Label>
                <Input
                  id="rate_kg_per_week"
                  name="rate_kg_per_week"
                  type="number"
                  step="0.1"
                  // Negative for cut, 0 for maintain, positive for bulk
                  defaultValue={-0.5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Usa negativo para perder peso (p. ej. -0.5), 0 para mantener, positivo para ganar (p. ej. 0.25).
                </p>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/today')}>
                Cancelar
              </Button>
              <Button type="submit">Calcular y guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
