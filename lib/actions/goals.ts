'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { OnboardingSchema } from '@/lib/validators/onboarding'
import { computeMacros } from '@/lib/utils/macros'

export async function computeAndSaveTargets(formData: FormData) {
  // Parse and validate inputs from <form>
  const raw = Object.fromEntries(formData.entries())
  const parsed = OnboardingSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(msg)
  }
  const input = parsed.data

  // Compute targets
  const { protein_g, carbs_g, fat_g, targetKcal } = computeMacros({
    sex: input.sex,
    age: input.age,
    height_cm: input.height_cm,
    weight_kg: input.weight_kg,
    activity: input.activity,
    goal: input.goal,
    rate_kg_per_week: input.rate_kg_per_week,
  })

  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr) throw authErr
  if (!user) throw new Error('Unauthorized')

  // Insert a new snapshot into public.goals
  const { error } = await supabase.from('goals').insert({
    user_id: user.id,
    kcal_target: targetKcal,
    protein_g,
    carbs_g,
    fat_g,
  })
  if (error) {
    throw new Error(error.message)
  }

  // Refresh pages and send user to Today
  revalidatePath('/today')
  redirect('/today')
}
