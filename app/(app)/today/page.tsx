'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { MacroCard } from '@/components/nutrition/macro-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Clock, Utensils, Dumbbell, Plus } from 'lucide-react'
import { MacroGoals, getCurrentDate, formatTime } from '@/lib/utils'
import TodayFab from './fab'
import QuickAddDialog from './quick-add-dialog'
import AddFoodDialog from './add-food-dialog'
import SelectTemplateDialog from './select-template-dialog'
import DuplicateDayDialog from './duplicate-day-dialog'
import AddWorkoutDialog from './add-workout-dialog'

interface DayPlanItem {
  id: string
  entry_type: 'food' | 'quick'
  food?: { name: string; unit: string; kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number } | null
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

interface WorkoutRow {
  id: string
  name: string
  date: string
  description?: string | null
  is_gym?: boolean | null
  is_boxing?: boolean | null
}

interface TodayData {
  goals: MacroGoals
  consumed: MacroGoals
  remaining: MacroGoals
  meals: DayPlanItem[]
  trainingDay: boolean
  planId: string | null
  workouts: WorkoutRow[]
}

type GoalsRow = {
  kcal_target: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

export default function TodayPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()
  const [userId, setUserId] = useState<string | null>(null)
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)

  const [openQuick, setOpenQuick] = useState(false)
  const [openFood, setOpenFood] = useState(false)
  const [openTemplate, setOpenTemplate] = useState(false)
  const [openDuplicate, setOpenDuplicate] = useState(false)
  const [openWorkout, setOpenWorkout] = useState(false)

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

      // Goals (último registro del usuario o redirect a onboarding)
      const goalsResp = await supabase
        .from('goals')
        .select('kcal_target, protein_g, carbs_g, fat_g')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const goalsRow = (goalsResp.data as GoalsRow | null) ?? null

      // If user has no goals yet → go to onboarding, then come back to /today
      if (!goalsRow) {
        setLoading(false)
        router.replace('/onboarding?next=%2Ftoday')
        return
      }

      // Plan de hoy
      const planResp = await supabase
        .from('day_plans')
        .select('*')
        .eq('user_id', uid)
        .eq('date', today)
        .maybeSingle()

      const planData = (planResp.data as any) ?? null

      let meals: DayPlanItem[] = []
      const consumed: MacroGoals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

      if (planData?.id) {
        const itemsResp = await supabase
          .from('day_plan_items')
          .select(`
            id,
            entry_type,
            qty_units,
            time,
            done,
            macros_override,
            food:foods(name, unit, kcal, protein_g, carbs_g, fat_g)
          `)
          .eq('day_plan_id', planData.id)
          .order('time', { ascending: true })

        const mealItems = (itemsResp.data as any[] | null) ?? []
        meals = mealItems.map((item) => {
          const isQuick = item.entry_type === 'quick'
          const macros = isQuick
            ? {
                kcal: Math.round(Number(item.macros_override?.kcal ?? 0)),
                protein: Math.round(Number(item.macros_override?.protein ?? 0) * 10) / 10,
                carbs: Math.round(Number(item.macros_override?.carbs ?? 0) * 10) / 10,
                fat: Math.round(Number(item.macros_override?.fat ?? 0) * 10) / 10,
              }
            : {
                kcal: Math.round(((item.food?.kcal ?? 0) as number) * (item.qty_units as number)),
                protein: Math.round((((item.food?.protein_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
                carbs: Math.round((((item.food?.carbs_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
                fat: Math.round((((item.food?.fat_g ?? 0) as number) * (item.qty_units as number)) * 10) / 10,
              }

          if (item.done) {
            consumed.kcal += macros.kcal
            consumed.protein += macros.protein
            consumed.carbs += macros.carbs
            consumed.fat += macros.fat
          }

          return {
            id: item.id,
            entry_type: item.entry_type,
            food: item.food ? { name: item.food.name, unit: item.food.unit } : null,
            qty_units: item.qty_units,
            time: item.time,
            done: item.done,
            macros,
          } as DayPlanItem
        })
      }

      const baseGoals: MacroGoals = {
        kcal: goalsRow.kcal_target ?? 2000,
        protein: goalsRow.protein_g ?? 150,
        carbs: goalsRow.carbs_g ?? 220,
        fat: goalsRow.fat_g ?? 60,
      }

      const remaining: MacroGoals = {
        kcal: Math.max(0, baseGoals.kcal - consumed.kcal),
        protein: Math.max(0, baseGoals.protein - consumed.protein),
        carbs: Math.max(0, baseGoals.carbs - consumed.carbs),
        fat: Math.max(0, baseGoals.fat - consumed.fat),
      }

      // Workouts for today
      const wResp = await supabase
        .from('workouts')
        .select('id,name,date,description,is_gym,is_boxing')
        .eq('user_id', uid)
        .eq('date', today)
        .order('created_at', { ascending: false })

      const workouts: WorkoutRow[] =
        (wResp.data as any[] | null)?.map((w) => ({
          id: w.id,
          name: w.name,
          date: w.date,
          description: w.description,
          is_gym: w.is_gym,
          is_boxing: w.is_boxing,
        })) ?? []

      setData({
        goals: baseGoals,
        consumed,
        remaining,
        meals,
        trainingDay: Boolean(planData?.training_day),
        planId: planData?.id ?? null,
        workouts,
      })
    } catch (error) {
      console.error('Error loading today data:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = async (foodId: string, qtyUnits: number, time: string) => {
    if (!user) return
    const today = getCurrentDate()

    // asegurar plan del día
    let planId = data?.planId
    if (!planId) {
      const { data: newPlan, error: planErr } = await (supabase as any)
        .from('day_plans')
        .insert({ user_id: user.id, date: today, training_day: false })
        .select('id')
        .single()
      if (planErr) {
        console.error('create plan error', planErr)
        return
      }
      planId = (newPlan as any)?.id
    }

    const { error: itemErr } = await (supabase as any)
      .from('day_plan_items')
      .insert({
        day_plan_id: planId,
        food_id: foodId,
        qty_units: qtyUnits,
        time,
        done: false,
        entry_type: 'food',
      })

    if (itemErr) {
      console.error('add item error', itemErr)
      return
    }

    if (userId) await loadTodayData(userId)
  }

  const toggleMealDone = async (itemId: string, done: boolean) => {
    try {
      await (supabase as any)
        .from('day_plan_items')
        .update({ done })
        .eq('id', itemId)
      if (userId) await loadTodayData(userId)
    } catch (error) {
      console.error('Error updating meal:', error)
    }
  }

  const handleAddWorkout = async (name: string, description?: string | null) => {
    if (!user) return
    try {
      const today = getCurrentDate()
      const { error } = await (supabase as any)
        .from('workouts')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          date: today,
          is_gym: false,
          is_boxing: false,
        })
      if (error) throw error
      setOpenWorkout(false)
      if (userId) await loadTodayData(userId)
    } catch (e) {
      console.error('Error creating workout:', e)
    }
  }

  const goPlanMyDay = () => {
    const date = getCurrentDate()
    router.push(`/plan-my-day?date=${encodeURIComponent(date)}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!data || !userId) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay datos para hoy</p>
        <div className="mt-4">
          <Button onClick={goPlanMyDay}>Planificar mi día</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        <div className="flex flex-wrap items-center gap-2">
          {/* CTA: Plan my day */}
          <Button onClick={goPlanMyDay}>
            Planificar mi día
          </Button>

          <Button variant="outline" onClick={() => setOpenFood(true)}>
            <Utensils className="h-4 w-4 mr-2" /> Añadir comida
          </Button>
          <Button variant="outline" onClick={() => setOpenQuick(true)}>
            <Plus className="h-4 w-4 mr-2" /> Entrada rápida
          </Button>
          <Button onClick={() => setOpenWorkout(true)}>
            <Dumbbell className="h-4 w-4 mr-2" /> Añadir entreno
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Utensils className="h-5 w-5" />
        <span>{data.trainingDay ? 'Día de entrenamiento' : 'Día de descanso'}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MacroCard
            goals={data.goals}
            consumed={data.consumed}
            title="Progreso del día"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comidas de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {data.meals.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aún no has añadido comidas.{' '}
                  <button
                    type="button"
                    className="underline"
                    onClick={goPlanMyDay}
                  >
                    Genera un plan
                  </button>
                  .
                </div>
              ) : (
                <div className="space-y-3">
                  {data.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          className="text-muted-foreground hover:text-foreground transition"
                          onClick={() => toggleMealDone(meal.id, !meal.done)}
                          title={
                            meal.done
                              ? 'Marcar como pendiente'
                              : 'Marcar como hecho'
                          }
                        >
                          {meal.done ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium">
                            {meal.entry_type === 'quick'
                              ? 'Entrada rápida'
                              : meal.food?.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(meal.time || '00:00')}</span>
                            {meal.entry_type === 'food' && (
                              <span>· {meal.qty_units} {meal.food?.unit}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{meal.macros.kcal} kcal</div>
                        <div className="text-xs text-muted-foreground flex gap-2 justify-end">
                          <div>P: {meal.macros.protein}g</div>
                          <div>C: {meal.macros.carbs}g</div>
                          <div>G: {meal.macros.fat}g</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entrenos de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              {data.workouts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No hay entrenos para hoy. Crea uno con “Añadir entreno”.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.workouts.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Dumbbell className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{w.name}</div>
                          {w.description && (
                            <div className="text-xs text-muted-foreground">
                              {w.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/entrenos')}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TodayFab
        onAddFood={() => setOpenFood(true)}
        onQuickAdd={() => setOpenQuick(true)}
        onApplyTemplate={() => setOpenTemplate(true)}
        onDuplicateDay={() => setOpenDuplicate(true)}
      />

      {/* Diálogos */}
      <QuickAddDialog
        open={openQuick}
        onOpenChange={setOpenQuick}
        userId={userId!}
        onCreated={() => loadTodayData(userId!)}
      />

      <AddFoodDialog
        open={openFood}
        onOpenChange={setOpenFood}
        onAddMeal={handleAddMeal}
      />

      <SelectTemplateDialog
        open={openTemplate}
        onOpenChange={setOpenTemplate}
        onApplied={() => {
          if (userId) loadTodayData(userId)
        }}
      />

      <DuplicateDayDialog
        open={openDuplicate}
        onOpenChange={setOpenDuplicate}
        onCopied={() => {
          if (userId) loadTodayData(userId)
        }}
      />

      <AddWorkoutDialog
        open={openWorkout}
        onOpenChange={setOpenWorkout}
        onCreate={handleAddWorkout}
      />
    </div>
  )
}
