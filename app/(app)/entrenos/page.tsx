'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell, Plus, Edit, Trash2, Timer, Target } from 'lucide-react'
import type { Database } from '@/types/database'

type Exercise = Database['public']['Tables']['exercises']['Row']
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'] & {
  exercise: Exercise
}
type Workout = Database['public']['Tables']['workouts']['Row'] & {
  exercises: WorkoutExercise[]
}

type SessionRow = {
  id: string
  workout_id: string | null
  started_at: string | null
  completed_at: string | null
  workouts?: { name: string } | null
}

type PRRow = {
  exercise_id: string
  pr_type: string
  value_numeric: number
  achieved_at: string
  exercise?: { name: string } | null
}

export default function EntrenosPage() {
  const router = useRouter()
  const { user, supabase } = useSupabase()

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

  const [recentSessions, setRecentSessions] = useState<SessionRow[]>([])
  const [prs, setPrs] = useState<PRRow[]>([])
  const [openSessionId, setOpenSessionId] = useState<string | null>(null)

  const [workoutData, setWorkoutData] = useState({
    name: '',
    description: '',
    is_gym: false,
    is_boxing: false,
    exercises: [] as {
      exercise_id: string
      sets: number
      reps: number
      rir: number
      rest_seconds: number
    }[]
  })

  const [exerciseData, setExerciseData] = useState({
    name: '',
    muscle: '',
    default_sets: 3,
    default_reps: 10
  })

  useEffect(() => {
    if (!user) return
    loadAll(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadAll(userId: string) {
    try {
      setLoading(true)

      // 1) Rutinas + ejercicios anidados (sin columna "order")
      const { data: workoutsData, error: workoutsErr } = await supabase
        .from('workouts')
        .select(`
          id, user_id, name, description, is_gym, is_boxing, created_at,
          exercises:workout_exercises(
            id, exercise_id, sets, reps, rir, rest_seconds,
            exercise:exercises(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { foreignTable: 'workout_exercises', ascending: true })

      if (workoutsErr) {
        console.error('workouts error', workoutsErr)
        setWorkouts([])
      } else {
        setWorkouts((workoutsData as unknown as Workout[]) ?? [])
      }

      // 2) Catálogo de ejercicios
      const { data: exercisesData, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true })

      if (exErr) {
        console.error('exercises error', exErr)
        setExercises([])
      } else {
        setExercises((exercisesData as Exercise[]) ?? [])
      }

      // 3) Sesión abierta (completed_at IS NULL) para mostrar CTA de continuar
      const { data: openList, error: openErr } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)

      if (openErr) {
        console.error('open session err', openErr)
      }

      const openId =
        (openList as Array<{ id: string }> | null)?.[0]?.id ?? null

      setOpenSessionId(openId)


      // 4) Últimas sesiones (tanto completadas como abiertas)
      const { data: sessData, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id, workout_id, started_at, completed_at, workouts:workout_id(name)')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(30)

      if (sessErr) {
        console.error('sessions list err', sessErr)
        setRecentSessions([])
      } else {
        setRecentSessions((sessData as unknown as SessionRow[]) ?? [])
      }

      // 5) PRs sin join embebido (tipado explícito para evitar 'never')
      type PRRow = {
        exercise_id: string | null
        pr_type: string | null
        value_numeric: number | null
        achieved_at: string | null
      }

      type ExerciseLite = { id: string; name: string }

      try {
        const { data: prsRaw, error: prsErr } = await supabase
          .from('exercise_prs')
          .select('exercise_id, pr_type, value_numeric, achieved_at')
          .eq('user_id', userId)
          .order('achieved_at', { ascending: false })
          .limit(20)

        if (prsErr) {
          console.warn('prs list err', prsErr)
          setPrs([])
        } else {
          const prs = (prsRaw ?? []) as PRRow[]

          // ids únicos (type guard para filtrar nulls)
          const ids = Array.from(
            new Set(prs.map(r => r.exercise_id).filter((x): x is string => !!x))
          )

          const { data: exRows } = ids.length
            ? await supabase.from('exercises').select('id, name').in('id', ids)
            : { data: [] as ExerciseLite[] }

          const map = new Map<string, string>(
            ((exRows ?? []) as ExerciseLite[]).map(e => [e.id, e.name])
          )

          const hydrated = prs.map(r => ({
            ...r,
            exercise: { name: map.get(r.exercise_id ?? '') ?? r.exercise_id ?? '—' }
          }))

          setPrs(hydrated as any)
        }
      } catch (e) {
        console.warn('prs list catch', e)
        setPrs([])
      }


    } finally {
      setLoading(false)
    }
  }

  // === Rutinas ===

  const createWorkout = async () => {
    if (!user) return
    try {
      const supabaseClient = supabase as any

      // Crear rutina
      const { data: workout, error: workoutError } = await supabaseClient
        .from('workouts')
        .insert({
          user_id: user.id,
          name: workoutData.name,
          description: workoutData.description || null,
          is_gym: workoutData.is_gym,
          is_boxing: workoutData.is_boxing
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Crear ejercicios (sin "order")
      if (workoutData.exercises.length > 0) {
        const rows = workoutData.exercises.map((ex) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rir: ex.rir || null,
          rest_seconds: ex.rest_seconds || null
        }))
        const { error: exercisesError } = await supabaseClient
          .from('workout_exercises')
          .insert(rows as any)

        if (exercisesError) throw exercisesError
      }

      setWorkoutData({
        name: '',
        description: '',
        is_gym: false,
        is_boxing: false,
        exercises: []
      })
      setShowCreateWorkout(false)
      await loadAll(user.id)
    } catch (error) {
      console.error('Error creating workout:', error)
    }
  }

  const updateWorkout = async () => {
    if (!editingWorkout || !user) return
    try {
      // Actualizar rutina
      const { error: workoutError } = await (supabase.from('workouts') as any)
        .update({
          name: workoutData.name,
          description: workoutData.description || null,
          is_gym: workoutData.is_gym,
          is_boxing: workoutData.is_boxing
        })
        .eq('id', editingWorkout.id)

      if (workoutError) throw workoutError

      // Eliminar ejercicios existentes
      const { error: delErr } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', editingWorkout.id)
      if (delErr) throw delErr

      // Insertar nuevos ejercicios
      if (workoutData.exercises.length > 0) {
        const rows = workoutData.exercises.map((ex) => ({
          workout_id: editingWorkout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rir: ex.rir || null,
          rest_seconds: ex.rest_seconds || null
        }))
        const { error: insErr } = await (supabase.from('workout_exercises') as any)
          .insert(rows as any)
        if (insErr) throw insErr
      }

      setWorkoutData({
        name: '',
        description: '',
        is_gym: false,
        is_boxing: false,
        exercises: []
      })
      setEditingWorkout(null)
      await loadAll(user.id)
    } catch (error) {
      console.error('Error updating workout:', error)
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId)
      if (error) throw error
      if (user) await loadAll(user.id)
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  // === Ejercicios ===

  const createExercise = async () => {
    try {
      // IMPORTANTE: usar select() para obtener el registro creado (el insert puro devuelve 201 sin payload)
      const { data: created, error } = await supabase
        .from('exercises')
        .insert([{
          name: exerciseData.name,
          muscle: exerciseData.muscle,
          default_sets: exerciseData.default_sets,
          default_reps: exerciseData.default_reps
        }] as any)
        .select('*')
        .single()

      if (error) throw error

      // Añadimos al estado local para ver el nuevo en el selector sin esperar al reload
      if (created) {
        setExercises(prev => [...prev, created as Exercise].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      }

      setExerciseData({ name: '', muscle: '', default_sets: 3, default_reps: 10 })
      setShowCreateExercise(false)
      if (user) await loadAll(user.id)
    } catch (error) {
      console.error('Error creating exercise:', error)
    }
  }

  // === Sesiones ===

  const startSessionFromWorkout = async (workoutId: string) => {
    if (!user) return
    const { data, error } = await (supabase as any)
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        started_at: new Date().toISOString(),
        completed_at: null
      })
      .select('id')
      .single()

    if (error) {
      console.error('start session error', error)
      return
    }
    const id = String(data.id)
    setOpenSessionId(id)
    router.push(`/entrenos/log/${id}`)
  }

  const continueOpenSession = () => {
    if (openSessionId) {
      router.push(`/entrenos/log/${openSessionId}`)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tus Entrenamientos</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateWorkout(true)} disabled={showCreateWorkout}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Rutina
          </Button>
          <Button onClick={() => setShowCreateExercise(true)} disabled={showCreateExercise} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Ejercicio
          </Button>
        </div>
      </div>

      {/* CTA sesión en curso */}
      {openSessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Sesión en curso</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>¡Tienes una sesión sin completar!</div>
            <Button onClick={continueOpenSession}>Continuar</Button>
          </CardContent>
        </Card>
      )}

      {/* Crear / Editar Rutina */}
      {showCreateWorkout && (
        <Card>
          <CardHeader>
            <CardTitle>{editingWorkout ? 'Editar Rutina' : 'Nueva Rutina'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={workoutData.name}
                  onChange={(e) => setWorkoutData({ ...workoutData, name: e.target.value })}
                  placeholder="Nombre de la rutina"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Input
                  value={workoutData.description}
                  onChange={(e) => setWorkoutData({ ...workoutData, description: e.target.value })}
                  placeholder="Descripción de la rutina"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workoutData.is_gym}
                    onChange={(e) => setWorkoutData({ ...workoutData, is_gym: e.target.checked })}
                  />
                  Gimnasio
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={workoutData.is_boxing}
                    onChange={(e) => setWorkoutData({ ...workoutData, is_boxing: e.target.checked })}
                  />
                  Boxeo
                </label>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Ejercicios</h3>
                <div className="space-y-4">
                  {workoutData.exercises.map((ex, index) => {
                    const exDetails = exercises.find(e => e.id === ex.exercise_id)
                    return (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="flex-1">
                          <select
                            value={ex.exercise_id}
                            onChange={(e) => {
                              const id = e.target.value
                              const found = exercises.find(x => x.id === id)
                              const next = [...workoutData.exercises]
                              next[index] = {
                                ...next[index],
                                exercise_id: id,
                                sets: found?.default_sets ?? 3,
                                reps: found?.default_reps ?? 10
                              }
                              setWorkoutData({ ...workoutData, exercises: next })
                            }}
                            className="w-full rounded-lg border p-2"
                          >
                            <option value="">Selecciona un ejercicio</option>
                            {exercises.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                          {exDetails && (
                            <div className="text-sm text-gray-500 mt-1">{exDetails.muscle}</div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => {
                              const next = [...workoutData.exercises]
                              next[index] = { ...next[index], sets: parseInt(e.target.value) || 0 }
                              setWorkoutData({ ...workoutData, exercises: next })
                            }}
                            className="w-20"
                            placeholder="Sets"
                          />
                          <Input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => {
                              const next = [...workoutData.exercises]
                              next[index] = { ...next[index], reps: parseInt(e.target.value) || 0 }
                              setWorkoutData({ ...workoutData, exercises: next })
                            }}
                            className="w-20"
                            placeholder="Reps"
                          />
                          <Input
                            type="number"
                            value={ex.rir}
                            onChange={(e) => {
                              const next = [...workoutData.exercises]
                              next[index] = { ...next[index], rir: parseInt(e.target.value) || 0 }
                              setWorkoutData({ ...workoutData, exercises: next })
                            }}
                            className="w-20"
                            placeholder="RIR"
                          />
                          <Input
                            type="number"
                            value={ex.rest_seconds}
                            onChange={(e) => {
                              const next = [...workoutData.exercises]
                              next[index] = { ...next[index], rest_seconds: parseInt(e.target.value) || 0 }
                              setWorkoutData({ ...workoutData, exercises: next })
                            }}
                            className="w-24"
                            placeholder="Descanso (s)"
                          />
                        </div>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            const next = [...workoutData.exercises]
                            next.splice(index, 1)
                            setWorkoutData({ ...workoutData, exercises: next })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}

                  <Button
                    onClick={() =>
                      setWorkoutData((prev) => ({
                        ...prev,
                        exercises: [
                          ...prev.exercises,
                          { exercise_id: '', sets: 3, reps: 10, rir: 2, rest_seconds: 60 }
                        ]
                      }))
                    }
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Ejercicio
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingWorkout ? updateWorkout : createWorkout}
                  disabled={!workoutData.name || workoutData.exercises.length === 0}
                  className="flex-1"
                >
                  {editingWorkout ? 'Actualizar' : 'Crear'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateWorkout(false)
                    setEditingWorkout(null)
                    setWorkoutData({
                      name: '',
                      description: '',
                      is_gym: false,
                      is_boxing: false,
                      exercises: []
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Crear Ejercicio */}
      {showCreateExercise && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Ejercicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={exerciseData.name}
                onChange={(e) => setExerciseData({ ...exerciseData, name: e.target.value })}
                placeholder="Nombre del ejercicio"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Músculo</label>
              <Input
                value={exerciseData.muscle}
                onChange={(e) => setExerciseData({ ...exerciseData, muscle: e.target.value })}
                placeholder="Músculo principal"
              />
            </div>

            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium">Series por defecto</label>
                <Input
                  type="number"
                  value={exerciseData.default_sets}
                  onChange={(e) =>
                    setExerciseData({ ...exerciseData, default_sets: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Repeticiones por defecto</label>
                <Input
                  type="number"
                  value={exerciseData.default_reps}
                  onChange={(e) =>
                    setExerciseData({ ...exerciseData, default_reps: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createExercise}
                disabled={!exerciseData.name || !exerciseData.muscle}
                className="flex-1"
              >
                Crear
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateExercise(false)
                  setExerciseData({ name: '', muscle: '', default_sets: 3, default_reps: 10 })
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listado de rutinas */}
      <div className="space-y-4">
        {loading ? (
          <div>Cargando...</div>
        ) : workouts.length > 0 ? (
          workouts.map((workout) => (
            <Card key={workout.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{workout.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startSessionFromWorkout(workout.id)}
                    >
                      Empezar sesión
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setWorkoutData({
                          name: workout.name,
                          description: workout.description || '',
                          is_gym: workout.is_gym,
                          is_boxing: workout.is_boxing,
                          exercises: workout.exercises.map(ex => ({
                            exercise_id: ex.exercise_id,
                            sets: ex.sets,
                            reps: ex.reps,
                            rir: ex.rir || 2,
                            rest_seconds: ex.rest_seconds || 60
                          }))
                        })
                        setEditingWorkout(workout)
                        setShowCreateWorkout(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteWorkout(workout.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {workout.description && (
                  <p className="text-sm text-gray-500">{workout.description}</p>
                )}
                <div className="flex gap-2">
                  {workout.is_gym && (
                    <div className="text-sm text-gray-500">
                      <Dumbbell className="h-4 w-4 inline-block mr-1" />
                      Gimnasio
                    </div>
                  )}
                  {workout.is_boxing && <div className="text-sm text-gray-500">🥊 Boxeo</div>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workout.exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{ex.exercise.name}</div>
                        <div className="text-sm text-gray-500">{ex.exercise.muscle}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-sm text-gray-500">
                          <Dumbbell className="h-4 w-4 inline-block mr-1" />
                          {ex.sets} × {ex.reps}
                        </div>
                        {ex.rir != null && (
                          <div className="text-sm text-gray-500">
                            <Target className="h-4 w-4 inline-block mr-1" />
                            RIR {ex.rir}
                          </div>
                        )}
                        {ex.rest_seconds != null && (
                          <div className="text-sm text-gray-500">
                            <Timer className="h-4 w-4 inline-block mr-1" />
                            {Math.floor(ex.rest_seconds / 60)}:
                            {String(ex.rest_seconds % 60).padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-gray-500">No hay rutinas creadas</div>
        )}
      </div>

      {/* Últimas sesiones + PRs */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Últimas sesiones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentSessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">Aún no hay sesiones</div>
            ) : (
              recentSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{s.workouts?.name ?? 'Sesión'}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.started_at ? new Date(s.started_at).toLocaleString('es-ES') : '—'}
                      {s.completed_at ? ' · Completada' : ' · En curso'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!s.completed_at && (
                      <Button size="sm" variant="outline" onClick={() => router.push(`/entrenos/log/${s.id}`)}>
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/entrenos/history')}>
                Ver historial
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>PRs recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {prs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin PRs registrados</div>
            ) : (
              prs.map((p, i) => (
                <div key={i} className="flex items-center justify-between border rounded p-2">
                  <div className="font-medium">{p.exercise?.name ?? p.exercise_id}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.pr_type === 'weight'
                      ? `${p.value_numeric}kg`
                      : p.pr_type === 'reps'
                        ? `${p.value_numeric} reps`
                        : p.value_numeric}
                    {' · '}
                    {new Date(p.achieved_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
