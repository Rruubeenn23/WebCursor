'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { createWorkoutSchema, type CreateWorkoutInput } from '@/lib/validators/workouts'

export async function createWorkout(input: CreateWorkoutInput) {
  const parsed = createWorkoutSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.errors.map(e => e.message).join(', '))

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Your Database types currently don't have 'workouts'. Bypass type constraint here:
  const { error } = await (supabase as any)
    .from('workouts')
    .insert([{ user_id: user.id, name: parsed.data.name, date: parsed.data.date }])

  if (error) throw error
  revalidatePath('/(app)/entrenos')
}
