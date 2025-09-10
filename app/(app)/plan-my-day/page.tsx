'use client'

import { useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { initialPlanState, planMyDay, type PlanMyDayState } from '@/lib/actions/plan'
import { getCurrentDate } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generando…' : 'Generar plan'}
    </Button>
  )
}

export default function PlanMyDayPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const qpDate = sp.get('date') || undefined
  const defaultDate = useMemo(() => qpDate ?? getCurrentDate(), [qpDate])

  const [state, formAction] = useFormState<PlanMyDayState, FormData>(planMyDay, initialPlanState)

  // When plan created, allow quick jump back to Today
  useEffect(() => {
    if (state?.ok && state?.date) {
      // no auto-redirect; we show results + give a button to go to /today
    }
  }, [state])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planificar mi día</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mode">Modo</Label>
                <Select defaultValue="replace" name="mode">
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">Reemplazar</SelectItem>
                    <SelectItem value="append">Añadir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="training_day">Día de entrenamiento</Label>
                <div className="flex items-center gap-2 h-10">
                  <input id="training_day" name="training_day" type="checkbox" className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">Marcar como día de entreno</span>
                </div>
              </div>
            </div>

            {state?.error ? (
              <div className="text-sm text-red-600">{state.error}</div>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/today')}>
                Cancelar
              </Button>
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result */}
      {state?.ok && state?.items && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Comidas creadas ({state.createdCount}) — {state.date}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.items.length === 0 ? (
                <div className="text-sm text-muted-foreground">No se crearon items.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4 w-24">Hora</th>
                        <th className="py-2 pr-4">Alimento</th>
                        <th className="py-2 pr-4">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.items.map((it) => (
                        <tr key={it.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{it.time}</td>
                          <td className="py-2 pr-4">{it.food.name}</td>
                          <td className="py-2 pr-4">
                            {it.qty_units} {it.food.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push('/comidas?date=' + encodeURIComponent(state.date!))}>
                  Ver comidas del día
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de la compra</CardTitle>
            </CardHeader>
            <CardContent>
              {state.shopping && state.shopping.length > 0 ? (
                <ul className="list-disc pl-6 text-sm">
                  {state.shopping.map((s, i) => (
                    <li key={i}>
                      {s.name}: <span className="font-medium">{s.qty_units}</span> {s.unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No hay elementos.</div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => router.push('/today')}>Ir a Hoy</Button>
          </div>
        </>
      )}
    </div>
  )
}
