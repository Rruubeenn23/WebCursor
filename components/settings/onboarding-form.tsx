'use client'

import { computeAndSaveTargets } from '@/lib/actions/goals'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type Props = { next?: string }

export default function OnboardingForm({ next = '/today' }: Props) {
  return (
    <Card className="w-full">
      <CardHeader><CardTitle>Datos personales y objetivo</CardTitle></CardHeader>
      <CardContent>
        <form action={computeAndSaveTargets} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="next" value={next} />
          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <Select name="sex" defaultValue="male">
              <SelectTrigger id="sex"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Hombre</SelectItem>
                <SelectItem value="female">Mujer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Edad</Label>
            <Input id="age" name="age" type="number" min={14} max={100} required defaultValue={28} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height_cm">Altura (cm)</Label>
            <Input id="height_cm" name="height_cm" type="number" min={120} max={250} required defaultValue={175} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight_kg">Peso (kg)</Label>
            <Input id="weight_kg" name="weight_kg" type="number" step="0.1" min={35} max={300} required defaultValue={75} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="activity">Actividad</Label>
            <Select name="activity" defaultValue="moderate">
              <SelectTrigger id="activity"><SelectValue placeholder="Selecciona" /></SelectTrigger>
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
            <Select name="goal" defaultValue="maintain">
              <SelectTrigger id="goal"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cut">Definición</SelectItem>
                <SelectItem value="maintain">Mantenimiento</SelectItem>
                <SelectItem value="bulk">Volumen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="rate_kg_per_week">Ritmo (kg/semana)</Label>
            <Input id="rate_kg_per_week" name="rate_kg_per_week" type="number" step="0.1" min={-1.5} max={1.0} required defaultValue={0} />
            <p className="text-xs text-muted-foreground">Negativo para perder peso, 0 mantener, positivo ganar.</p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit">Guardar y recalcular</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
