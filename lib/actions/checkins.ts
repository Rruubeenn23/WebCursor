'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { createCheckinSchema, type CreateCheckinInput } from '@/lib/validators/checkins'

export async function createCheckin(input: CreateCheckinInput) {
  const parsed = createCheckinSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map(e => e.message).join(', '))
  }

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const row = {
    user_id: user.id,
    week_start: parsed.data.week_start,
    weight_kg: parsed.data.weight_kg ?? null,
    waist_cm: parsed.data.waist_cm ?? null,
    sleep_h: parsed.data.sleep_h ?? null,
    hunger_1_5: parsed.data.hunger_1_5 ?? null,
    energy_1_5: parsed.data.energy_1_5 ?? null,
    stress_1_5: parsed.data.stress_1_5 ?? null,
    notes: parsed.data.notes ?? null,
  }

  const { error } = await (supabase as any)
    .from('checkins')
    .insert([row])

  if (error) throw error

  revalidatePath('/(app)/check-ins')
}
