'use client'

import { useEffect, useState } from 'react'
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

export default function EntrenosPage() {
  const { user, supabase } = useSupabase()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

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
    loadData(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadData = async (userId: string) => {
    try {
      setLoading(true)

      // Workouts + nested exercises (sin columna "order")
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

      // Exercises catálogo
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
    } finally {
      setLoading(false)
    }
  }

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

      // Crear ejercicios (sin "order"; si tienes "sort_index", añádelo aquí)
      if (workoutData.exercises.length > 0 && workout) {
        const rows = workoutData.exercises.map((ex) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rir: ex.rir || null,
          rest_seconds: ex.rest_seconds || null
          // sort_index: index + 1, // <- si creas esta columna en BD, descomenta
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
      await loadData(user.id)
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

      // Insertar nuevos ejercicios (sin "order")
      if (workoutData.exercises.length > 0) {
        const rows = workoutData.exercises.map((ex) => ({
          workout_id: editingWorkout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rir: ex.rir || null,
          rest_seconds: ex.rest_seconds || null
          // sort_index: index + 1, // <- si creas esta columna en BD, descomenta
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
      await loadData(user.id)
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
      if (user) await loadData(user.id)
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  const createExercise = async () => {
    try {
      const { error } = await supabase
        .from('exercises')
        .insert([{
          name: exerciseData.name,
          muscle: exerciseData.muscle,
          default_sets: exerciseData.default_sets,
          default_reps: exerciseData.default_reps
        }] as any)
      if (error) throw error

      setExerciseData({ name: '', muscle: '', default_sets: 3, default_reps: 10 })
      setShowCreateExercise(false)
      if (user) await loadData(user.id)
    } catch (error) {
      console.error('Error creating exercise:', error)
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
    </div>
  )
}
