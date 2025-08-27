'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Save, Target, Bell, Clock, User } from 'lucide-react'
import { MacroGoals } from '@/lib/utils'

interface UserSettings {
  id: string
  email: string
  tz: string
  created_at: string
}

interface UserGoals {
  id: string
  user_id: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  created_at: string
  updated_at: string
}

export default function AjustesPage() {
  const { user, supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [userGoals, setUserGoals] = useState<UserGoals | null>(null)
  const [goalsData, setGoalsData] = useState<MacroGoals>({
    kcal: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  })
  const [notifications, setNotifications] = useState({
    meal_reminders: true,
    workout_reminders: true,
    weekly_planning: true
  })

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  // 1) Mantén tus interfaces arriba (UserSettings, UserGoals, MacroGoals)

  const loadUserData = async () => {
    try {
      setLoading(true)
      if (!user) return

      // Configuración del usuario
      const { data: settingsData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      // Objetivos del usuario (OJO: renombrado y tipado explícito)
      const goalsResp = await supabase
        .from('goals')
        .select('id,user_id,kcal,protein,carbs,fat,created_at,updated_at')
        .eq('user_id', user.id)
        .maybeSingle() // evita throw si no hay fila

      setUserSettings(settingsData ?? null)

      if (goalsResp.data) {
        // Forzamos el tipo a tu interfaz
        const g = goalsResp.data as UserGoals

        setUserGoals(g)
        setGoalsData({
          kcal: g.kcal,
          protein: g.protein,
          carbs: g.carbs,
          fat: g.fat
        })
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }


  // const saveGoals = async () => {
  //   try {
  //     setSaving(true)
  //     if (!user) return
      
  //     if (userGoals) {
  //       // Actualizar objetivos existentes
  //       const { error } = await supabase
  //         .from('goals')
  //         .update({
  //           kcal: goalsData.kcal,
  //           protein: goalsData.protein,
  //           carbs: goalsData.carbs,
  //           fat: goalsData.fat
  //         })
  //         .eq('id', userGoals.id)

  //       if (error) throw error
  //     } else {
  //       // Crear nuevos objetivos
  //       const { data, error } = await supabase
  //         .from('goals')
  //         .insert({
  //           user_id: user.id,
  //           kcal: goalsData.kcal,
  //           protein: goalsData.protein,
  //           carbs: goalsData.carbs,
  //           fat: goalsData.fat
  //         })
  //         .select()
  //         .single()

  //       if (error) throw error
  //       setUserGoals(data)
  //     }

  //     // Mostrar mensaje de éxito
  //     alert('Objetivos guardados correctamente')
  //   } catch (error) {
  //     console.error('Error saving goals:', error)
  //     alert('Error al guardar los objetivos')
  //   } finally {
  //     setSaving(false)
  //   }
  // }

  const calculateMacroPercentages = () => {
    const totalKcal = goalsData.protein * 4 + goalsData.carbs * 4 + goalsData.fat * 9
    return {
      protein: Math.round((goalsData.protein * 4 / totalKcal) * 100),
      carbs: Math.round((goalsData.carbs * 4 / totalKcal) * 100),
      fat: Math.round((goalsData.fat * 9 / totalKcal) * 100)
    }
  }

  const updateGoal = (field: keyof MacroGoals, value: number) => {
    setGoalsData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando ajustes...</div>
      </div>
    )
  }

  const percentages = calculateMacroPercentages()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ajustes</h1>
          <p className="text-muted-foreground">
            Configura tus objetivos y preferencias
          </p>
        </div>
        <Button onClick={saveGoals} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Objetivos Nutricionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Objetivos Nutricionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Calorías diarias (kcal)</label>
              <Input
                type="number"
                value={goalsData.kcal}
                onChange={(e) => updateGoal('kcal', parseInt(e.target.value) || 0)}
                placeholder="2000"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proteína (g)</label>
                <Input
                  type="number"
                  value={goalsData.protein}
                  onChange={(e) => updateGoal('protein', parseInt(e.target.value) || 0)}
                  placeholder="150"
                />
                <p className="text-xs text-muted-foreground">{percentages.protein}%</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Carbohidratos (g)</label>
                <Input
                  type="number"
                  value={goalsData.carbs}
                  onChange={(e) => updateGoal('carbs', parseInt(e.target.value) || 0)}
                  placeholder="200"
                />
                <p className="text-xs text-muted-foreground">{percentages.carbs}%</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grasas (g)</label>
                <Input
                  type="number"
                  value={goalsData.fat}
                  onChange={(e) => updateGoal('fat', parseInt(e.target.value) || 0)}
                  placeholder="65"
                />
                <p className="text-xs text-muted-foreground">{percentages.fat}%</p>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Total calculado:</strong> {goalsData.protein * 4 + goalsData.carbs * 4 + goalsData.fat * 9} kcal
              </p>
              {Math.abs((goalsData.protein * 4 + goalsData.carbs * 4 + goalsData.fat * 9) - goalsData.kcal) > 10 && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ El total de macros no coincide con las calorías objetivo
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={userSettings?.email || user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Zona horaria</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={userSettings?.tz || 'Europe/Madrid'}
                disabled
              >
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
              </select>
              <p className="text-xs text-muted-foreground">
                La zona horaria se configura automáticamente
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de registro</label>
              <Input
                value={userSettings?.created_at ? new Date(userSettings.created_at).toLocaleDateString('es-ES') : ''}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de comidas</p>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones cada 15 minutos para comidas próximas
                  </p>
                </div>
                <Button
                  variant={notifications.meal_reminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, meal_reminders: !prev.meal_reminders }))}
                >
                  {notifications.meal_reminders ? 'Activado' : 'Desactivado'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recordatorios de entrenamiento</p>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones diarias a las 8:00 AM para días de entrenamiento
                  </p>
                </div>
                <Button
                  variant={notifications.workout_reminders ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, workout_reminders: !prev.workout_reminders }))}
                >
                  {notifications.workout_reminders ? 'Activado' : 'Desactivado'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Planificación semanal</p>
                  <p className="text-sm text-muted-foreground">
                    Generación automática de planes los domingos a las 20:00
                  </p>
                </div>
                <Button
                  variant={notifications.weekly_planning ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNotifications(prev => ({ ...prev, weekly_planning: !prev.weekly_planning }))}
                >
                  {notifications.weekly_planning ? 'Activado' : 'Desactivado'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Versión:</strong> 1.0.0
              </p>
              <p className="text-sm">
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
              </p>
              <p className="text-sm">
                <strong>Estado:</strong> <span className="text-green-600">Operativo</span>
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Funcionalidades disponibles:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Seguimiento de macros y calorías</li>
                <li>• Planificación semanal de entrenamiento</li>
                <li>• Templates de comidas reutilizables</li>
                <li>• Rutinas de ejercicios personalizadas</li>
                <li>• Automatizaciones con n8n</li>
                <li>• Notificaciones por Telegram</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
