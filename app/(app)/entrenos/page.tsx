'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dumbbell, Plus, Edit, Trash2, Search, Timer, Target } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  muscle: string
  default_sets: number
  default_reps: number
}

interface Workout {
  id: string
  name: string
  description?: string
  created_at: string
  exercises: WorkoutExercise[]
}

interface WorkoutExercise {
  id: string
  exercise_id: string
  sets: number
  reps: number
  rir?: number
  rest_seconds?: number
  order: number
  exercise: Exercise
}

export default function EntrenosPage() {
  const { user, supabase } = useSupabase()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateWorkout, setShowCreateWorkout] = useState(false)
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [workoutData, setWorkoutData] = useState({
    name: '',
    description: '',
    is_gym: false,
    is_boxing: false,
    exercises: [] as Array<{
      exercise_id: string
      sets: number
      reps: number
      rir: number
      rest_seconds: number
    }>
  })

  const [exerciseData, setExerciseData] = useState({
    name: '',
    muscle: '',
    default_sets: 3,
    default_reps: 10
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      if (!user) return
      
      // Cargar rutinas del usuario
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            id,
            exercise_id,
            sets,
            reps,
            rir,
            rest_seconds,
            order,
            exercise:exercises(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Cargar ejercicios disponibles
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      setWorkouts(workoutsData || [])
      setExercises(exercisesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWorkout = async () => {
    try {
      if (!user) return
      // Crear rutina
      const { data: workout, error: workoutError } = await supabase
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

      // Crear ejercicios de la rutina
      if (workoutData.exercises.length > 0) {
        const exercisesToInsert = workoutData.exercises.map((exercise, index) => ({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rir: exercise.rir || null,
          rest_seconds: exercise.rest_seconds || null,
          order: index + 1
        }))

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert)

        if (exercisesError) throw exercisesError
      }

      setWorkoutData({ name: '', description: '', exercises: [] })
      setShowCreateWorkout(false)
      loadData()
    } catch (error) {
      console.error('Error creating workout:', error)
    }
  }

  const updateWorkout = async () => {
    if (!editingWorkout) return

    try {
      // Actualizar rutina
      const { error: workoutError } = await supabase
        .from('workouts')
        .update({
          name: workoutData.name,
          description: workoutData.description || null,
          is_gym: workoutData.is_gym,
          is_boxing: workoutData.is_boxing
        })
        .eq('id', editingWorkout.id)

      if (workoutError) throw workoutError

      // Eliminar ejercicios existentes
      await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', editingWorkout.id)

      // Crear nuevos ejercicios
      if (workoutData.exercises.length > 0) {
        const exercisesToInsert = workoutData.exercises.map((exercise, index) => ({
          workout_id: editingWorkout.id,
          exercise_id: exercise.exercise_id,
          sets: exercise.sets,
          reps: exercise.reps,
          rir: exercise.rir || null,
          rest_seconds: exercise.rest_seconds || null,
          order: index + 1
        }))

        const { error: exercisesError } = await supabase
          .from('workout_exercises')
          .insert(exercisesToInsert)

        if (exercisesError) throw exercisesError
      }

      setWorkoutData({ name: '', description: '', exercises: [] })
      setEditingWorkout(null)
      loadData()
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
      loadData()
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  const createExercise = async () => {
    try {
      if (!user) return
      
      const { error } = await supabase
        .from('exercises')
        .insert({
          name: exerciseData.name,
          muscle: exerciseData.muscle,
          default_sets: exerciseData.default_sets,
          default_reps: exerciseData.default_reps
        })

      if (error) throw error

      setExerciseData({ name: '', muscle: '', default_sets: 3, default_reps: 10 })
      setShowCreateExercise(false)
      loadData()
    } catch (error) {
      console.error('Error creating exercise:', error)
    }
  }

  const addExerciseToWorkout = () => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { 
        exercise_id: '', 
        sets: 3, 
        reps: 10, 
        rir: 2, 
        rest_seconds: 90 
      }]
    }))
  }

  const removeExerciseFromWorkout = (index: number) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const updateExerciseInWorkout = (index: number, field: string, value: any) => {
    setWorkoutData(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => 
        i === index ? { ...exercise, [field]: value } : exercise
      )
    }))
  }

  const filteredWorkouts = workouts.filter(workout =>
    workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workout.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando entrenos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold">Entrenos</h1>
           <p className="text-muted-foreground">
             Gestiona tus rutinas y ejercicios
           </p>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={() => setShowCreateExercise(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Nuevo Ejercicio
           </Button>
           <Button onClick={() => setShowCreateWorkout(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Nueva Rutina
           </Button>
         </div>
       </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar rutinas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de rutinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{workout.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingWorkout(workout)
                                             setWorkoutData({
                         name: workout.name,
                         description: workout.description || '',
                         is_gym: workout.is_gym,
                         is_boxing: workout.is_boxing,
                         exercises: workout.exercises.map(exercise => ({
                           exercise_id: exercise.exercise_id,
                           sets: exercise.sets,
                           reps: exercise.reps,
                           rir: exercise.rir || 2,
                           rest_seconds: exercise.rest_seconds || 90
                         }))
                       })
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteWorkout(workout.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
                             {workout.description && (
                 <p className="text-sm text-muted-foreground">{workout.description}</p>
               )}
               <div className="flex gap-1 mt-2">
                 {workout.is_gym && (
                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                     <Dumbbell className="h-3 w-3 mr-1" />
                     Gimnasio
                   </span>
                 )}
                 {workout.is_boxing && (
                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                     🥊 Boxeo
                   </span>
                 )}
               </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-3 w-3 text-gray-400" />
                      <span>{exercise.exercise.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{exercise.sets}x{exercise.reps}</span>
                      {exercise.rir && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>RIR {exercise.rir}</span>
                        </span>
                      )}
                      {exercise.rest_seconds && (
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          <span>{exercise.rest_seconds}s</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

             {/* Modal para crear ejercicio */}
       {showCreateExercise && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <Card className="w-full max-w-md mx-4">
             <CardHeader>
               <CardTitle>Nuevo Ejercicio</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Nombre del ejercicio</label>
                 <Input
                   placeholder="Ej: Press de banca"
                   value={exerciseData.name}
                   onChange={(e) => setExerciseData(prev => ({ ...prev, name: e.target.value }))}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-medium">Grupo muscular</label>
                 <Input
                   placeholder="Ej: Pecho"
                   value={exerciseData.muscle}
                   onChange={(e) => setExerciseData(prev => ({ ...prev, muscle: e.target.value }))}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Series por defecto</label>
                   <Input
                     type="number"
                     value={exerciseData.default_sets}
                     onChange={(e) => setExerciseData(prev => ({ ...prev, default_sets: parseInt(e.target.value) || 0 }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium">Repeticiones por defecto</label>
                   <Input
                     type="number"
                     value={exerciseData.default_reps}
                     onChange={(e) => setExerciseData(prev => ({ ...prev, default_reps: parseInt(e.target.value) || 0 }))}
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
         </div>
       )}

       {/* Modal para crear/editar rutina */}
       {(showCreateWorkout || editingWorkout) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingWorkout ? 'Editar Rutina' : 'Nueva Rutina'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la rutina</label>
                <Input
                  placeholder="Ej: Rutina de pecho y tríceps"
                  value={workoutData.name}
                  onChange={(e) => setWorkoutData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

                             <div className="space-y-2">
                 <label className="text-sm font-medium">Descripción (opcional)</label>
                 <Input
                   placeholder="Ej: Rutina para hipertrofia de pecho y tríceps"
                   value={workoutData.description}
                   onChange={(e) => setWorkoutData(prev => ({ ...prev, description: e.target.value }))}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-sm font-medium">Tipo de entrenamiento</label>
                 <div className="flex gap-2">
                   <Button
                     type="button"
                     variant={workoutData.is_gym ? "default" : "outline"}
                     size="sm"
                     onClick={() => setWorkoutData(prev => ({ ...prev, is_gym: !prev.is_gym }))}
                     className="flex-1"
                   >
                     <Dumbbell className="h-3 w-3 mr-1" />
                     Gimnasio
                   </Button>
                   <Button
                     type="button"
                     variant={workoutData.is_boxing ? "default" : "outline"}
                     size="sm"
                     onClick={() => setWorkoutData(prev => ({ ...prev, is_boxing: !prev.is_boxing }))}
                     className="flex-1"
                   >
                     🥊
                     Boxeo
                   </Button>
                 </div>
               </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Ejercicios</label>
                  <Button size="sm" onClick={addExerciseToWorkout}>
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar
                  </Button>
                </div>

                <div className="space-y-2">
                  {workoutData.exercises.map((exercise, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        className="flex-1 px-3 py-2 border rounded-md"
                        value={exercise.exercise_id}
                        onChange={(e) => updateExerciseInWorkout(index, 'exercise_id', e.target.value)}
                      >
                        <option value="">Seleccionar ejercicio</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({ex.muscle})
                          </option>
                        ))}
                      </select>
                      
                      <Input
                        type="number"
                        placeholder="Series"
                        value={exercise.sets}
                        onChange={(e) => updateExerciseInWorkout(index, 'sets', parseInt(e.target.value) || 0)}
                        className="w-16"
                      />
                      
                      <Input
                        type="number"
                        placeholder="Reps"
                        value={exercise.reps}
                        onChange={(e) => updateExerciseInWorkout(index, 'reps', parseInt(e.target.value) || 0)}
                        className="w-16"
                      />
                      
                      <Input
                        type="number"
                        placeholder="RIR"
                        value={exercise.rir}
                        onChange={(e) => updateExerciseInWorkout(index, 'rir', parseInt(e.target.value) || 0)}
                        className="w-16"
                      />
                      
                      <Input
                        type="number"
                        placeholder="Descanso (s)"
                        value={exercise.rest_seconds}
                        onChange={(e) => updateExerciseInWorkout(index, 'rest_seconds', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeExerciseFromWorkout(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
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
                    setWorkoutData({ name: '', description: '', exercises: [] })
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
