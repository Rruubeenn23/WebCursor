'use server'

import { revalidatePath } from 'next/cache'
import { addWaterSchema, type AddWaterInput } from '@/lib/validators/water'
import { createServerSupabase } from '@/lib/supabase/server'

export async function addWater(input: AddWaterInput) {
  const parsed = addWaterSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map(e => e.message).join(', '))
  }
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // NOTE: Your DB column is amount_ml (no date column).
  const { error } = await supabase
    .from('water_logs')
    .insert([{ user_id: user.id, amount_ml: parsed.data.ml }])

  if (error) throw error

  revalidatePath('/(app)/today')
  revalidatePath('/(app)/agua')
}
