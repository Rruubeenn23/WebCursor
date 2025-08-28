'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Plus, Dumbbell, Coffee, Edit, Trash2 } from 'lucide-react'
import { getCurrentDate, formatDate, getDayName } from '@/lib/utils'

interface DayPlan {
  id: string
  date: string
  training_day: boolean
  notes?: string
  template_id?: string
  created_at: string
}

interface WeekPlan {
  [key: string]: DayPlan | null
}

export default function PlanPage() {
  const { user, supabase } = useSupabase()
  const supabaseClient = supabase as any // Temporal fix for type issues
  const [weekPlan, setWeekPlan] = useState<WeekPlan>({})
  const [loading, setLoading] = useState(true)
  const [creatingPlan, setCreatingPlan] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [planData, setPlanData] = useState({
    training_day: false,
    notes: '',
    template_id: ''
  })

  useEffect(() => {
    if (user) {
      loadWeekPlan()
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      if (!user) return
      
      const { data } = await supabaseClient
        .from('meal_templates')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadWeekPlan = async () => {
    try {
      setLoading(true)
      if (!user) return
      
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1) // Lunes

      const weekDates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        weekDates.push(formatDate(date))
      }

      // Cargar planes existentes
      const supabaseClient = supabase as any // Temporal fix for type issues
      const { data: existingPlans } = await supabaseClient
        .from('day_plans')
        .select('*')
        .eq('user_id', user.id)
        .in('date', weekDates)

      const weekPlanData: WeekPlan = {}
      const plans = existingPlans as DayPlan[] || []
      weekDates.forEach(date => {
        const existingPlan = plans.find(plan => plan.date === date)
        weekPlanData[date] = existingPlan || null
      })

      setWeekPlan(weekPlanData)
    } catch (error) {
      console.error('Error loading week plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDayPlan = async (date: string) => {
    try {
      if (!user) return
      setCreatingPlan(date)
      const { data, error } = await supabaseClient
        .from('day_plans')
        .insert({
          user_id: user.id,
          date,
          training_day: planData.training_day,
          notes: planData.notes || null,
          template_id: planData.template_id || null
        })
        .select()
        .single()

      if (error) throw error

      setWeekPlan(prev => ({
        ...prev,
        [date]: data
      }))

      setPlanData({ training_day: false, notes: '', template_id: '' })
      setCreatingPlan(null)
    } catch (error) {
      console.error('Error creating day plan:', error)
      setCreatingPlan(null)
    }
  }

  const updateDayPlan = async (date: string, updates: Partial<DayPlan>) => {
    try {
      const plan = weekPlan[date]
      if (!plan) return

      const { data, error } = await supabaseClient
        .from('day_plans')
        .update(updates)
        .eq('id', plan.id)
        .select()
        .single()

      if (error) throw error

      setWeekPlan(prev => ({
        ...prev,
        [date]: data
      }))
    } catch (error) {
      console.error('Error updating day plan:', error)
    }
  }

  const deleteDayPlan = async (date: string) => {
    try {
      const plan = weekPlan[date]
      if (!plan) return

      const { error } = await supabaseClient
        .from('day_plans')
        .delete()
        .eq('id', plan.id)

      if (error) throw error

      setWeekPlan(prev => ({
        ...prev,
        [date]: null
      }))
    } catch (error) {
      console.error('Error deleting day plan:', error)
    }
  }

  const getWeekDates = () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1) // Lunes

    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      weekDates.push(formatDate(date))
    }
    return weekDates
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando plan semanal...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plan Semanal</h1>
          <p className="text-muted-foreground">
            Organiza tu semana de entrenamiento y nutrición
          </p>
        </div>
        <Button onClick={loadWeekPlan} variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {getWeekDates().map((date) => {
          const plan = weekPlan[date]
          const isToday = date === getCurrentDate()
          const dayName = getDayName(date)

          return (
            <Card key={date} className={`${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {dayName}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {plan.training_day ? (
                        <Dumbbell className="h-4 w-4 text-green-600" />
                      ) : (
                        <Coffee className="h-4 w-4 text-orange-600" />
                      )}
                      <span className="text-xs font-medium">
                        {plan.training_day ? 'Entrenamiento' : 'Descanso'}
                      </span>
                    </div>
                    
                    {plan.notes && (
                      <p className="text-xs text-muted-foreground">
                        {plan.notes}
                      </p>
                    )}

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCreatingPlan(date)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDayPlan(date)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCreatingPlan(date)}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crear Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal para crear/editar plan */}
      {creatingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {weekPlan[creatingPlan] ? 'Editar Plan' : 'Crear Plan'} - {getDayName(creatingPlan)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de día</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={planData.training_day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlanData(prev => ({ ...prev, training_day: true }))}
                    className="flex-1"
                  >
                    <Dumbbell className="h-3 w-3 mr-1" />
                    Entrenamiento
                  </Button>
                  <Button
                    type="button"
                    variant={!planData.training_day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlanData(prev => ({ ...prev, training_day: false }))}
                    className="flex-1"
                  >
                    <Coffee className="h-3 w-3 mr-1" />
                    Descanso
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plantilla de Comida</label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={planData.template_id}
                  onChange={(e) => setPlanData(prev => ({ ...prev, template_id: e.target.value }))}
                >
                  <option value="">Selecciona una plantilla</option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Input
                  placeholder="Ej: Cardio 30min, descanso activo..."
                  value={planData.notes}
                  onChange={(e) => setPlanData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (weekPlan[creatingPlan]) {
                      updateDayPlan(creatingPlan, planData)
                    } else {
                      createDayPlan(creatingPlan)
                    }
                  }}
                  className="flex-1"
                >
                  {weekPlan[creatingPlan] ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatingPlan(null)
                    setPlanData({ training_day: false, notes: '', template_id: '' })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
