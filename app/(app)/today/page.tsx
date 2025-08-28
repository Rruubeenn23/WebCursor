'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { MacroCard } from '@/components/nutrition/macro-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Clock, Utensils, Plus } from 'lucide-react'
import { MacroGoals, getCurrentDate, formatTime } from '@/lib/utils'
import { AddMealDialog } from './add-meal-dialog'

type SupabaseClient = ReturnType<typeof useSupabase>['supabase']

interface DayPlanItem {
  id: string
  food: {
    name: string
    unit: string
  }
  qty_units: number
  time: string
  done: boolean
  macros: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
}

interface TodayData {
  goals: MacroGoals
  consumed: MacroGoals
  meals: DayPlanItem[]
  trainingDay: boolean
  planId?: string
}

// Fallback por si no hay goals en BD
const DEFAULT_GOALS: MacroGoals = { kcal: 2000, protein: 150, carbs: 200, fat: 65 }

export default function TodayPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const supabaseClient = supabase as any
  const [userId, setUserId] = useState<string | null>(null)
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [addMealOpen, setAddMealOpen] = useState(false)

  useEffect(() => {
    if (!user) {
      setUserId(null)
      setLoading(false)
      router.replace('/login')
      return
    }
    setUserId(user.id)
    loadTodayData(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadTodayData = async (uid: string) => {
    try {
      setLoading(true)
      const today = getCurrentDate()

      // Goals
      const goalsResp = await supabaseClient
        .from('goals')
        .select()
        .eq('user_id', uid)
        .single()
      const goalsData = (goalsResp.data as Partial<MacroGoals> | null) ?? null

      // Plan del día
      const planResp = await supabase
        .from('day_plans')
        .select('id, training_day')
        .eq('user_id', uid)
        .eq('date', today)
        .maybeSingle()
      const planData = (planResp.data as { id: string; training_day?: boolean } | null) ?? null

      let meals: DayPlanItem[] = []
      const consumed: MacroGoals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

      if (planData?.id) {
        const itemsResp = await supabase
          .from('day_plan_items')
          .select(`
            id,
            qty_units,
            time,
            done,
            food:foods(name, unit, kcal, protein_g, carbs_g, fat_g)
          `)
          .eq('day_plan_id', planData.id)
          .order('time')

        const mealItems = (itemsResp.data as any[] | null) ?? []

        meals = mealItems.map((item) => {
          const macros = {
            kcal: Math.round(((item.food?.kcal ?? 0) as number) * (item.qty_units as number)),
            protein:
              Math.round((((item.food?.protein_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
            carbs:
              Math.round((((item.food?.carbs_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
            fat:
              Math.round((((item.food?.fat_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
          }

          if (item.done) {
            consumed.kcal += macros.kcal
            consumed.protein += macros.protein
            consumed.carbs += macros.carbs
            consumed.fat += macros.fat
          }

          return {
            id: String(item.id),
            food: {
              name: String(item.food?.name ?? '—'),
              unit: String(item.food?.unit ?? ''),
            },
            qty_units: Number(item.qty_units ?? 0),
            time: String(item.time ?? '00:00'),
            done: Boolean(item.done),
            macros,
          } as DayPlanItem
        })
      }

      setData({
        goals: (goalsData && {
          kcal: Number(goalsData.kcal ?? DEFAULT_GOALS.kcal),
          protein: Number(goalsData.protein ?? DEFAULT_GOALS.protein),
          carbs: Number(goalsData.carbs ?? DEFAULT_GOALS.carbs),
          fat: Number(goalsData.fat ?? DEFAULT_GOALS.fat),
        }) || DEFAULT_GOALS,
        consumed,
        meals,
        trainingDay: Boolean(planData?.training_day),
        planId: planData?.id
      })
    } catch (error) {
      console.error('Error loading today data:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleMealDone = async (itemId: string, done: boolean) => {
    try {
      await supabaseClient
        .from('day_plan_items')
        .update({ done })
        .eq('id', itemId)

      if (userId) await loadTodayData(userId)
    } catch (error) {
      console.error('Error updating meal:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay datos para hoy</p>
        <Button className="mt-4">Crear plan del día</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hoy</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          <span className="text-sm">
            {data.trainingDay ? 'Día de entrenamiento' : 'Día de descanso'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macro Card */}
        <div className="lg:col-span-1">
          <MacroCard goals={data.goals} consumed={data.consumed} title="Progreso del día" />
        </div>

        {/* Meals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comidas del día</CardTitle>
              <Button size="sm" onClick={() => setAddMealOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Comida
              </Button>
            </CardHeader>
            <CardContent>
              {data.meals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay comidas planificadas para hoy
                </p>
              ) : (
                <div className="space-y-4">
                  {data.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        meal.done
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleMealDone(meal.id, !meal.done)}
                          className="flex-shrink-0"
                        >
                          {meal.done ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatTime(meal.time)}</span>
                        </div>

                        <div>
                          <div className="font-medium">{meal.food.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {meal.qty_units} {meal.food.unit} • {meal.macros.kcal} kcal
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-sm text-muted-foreground">
                        <div>P: {meal.macros.protein}g</div>
                        <div>C: {meal.macros.carbs}g</div>
                        <div>G: {meal.macros.fat}g</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Renderiza el diálogo solo si hay userId */}
      {userId && (
        <AddMealDialog
          open={addMealOpen}
          onOpenChange={setAddMealOpen}
          date={getCurrentDate()}
          userId={userId}
          onCreated={() => loadTodayData(userId)}
        />
      )}
    </div>
  )
}
