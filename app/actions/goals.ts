'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { OnboardingSchema } from '@/lib/validators/onboarding'
import { computeMacros } from '@/lib/utils/macros'

export async function computeAndSaveTargets(formData: FormData) {
  // Optional `next` target to redirect after success
  const next = (formData.get('next') as string) || '/today'

  // Parse and validate inputs from <form>
  const raw = Object.fromEntries(formData.entries())

  // Pull only the fields the schema expects
  const input = {
    sex: raw['sex'],
    age: raw['age'],
    height_cm: raw['height_cm'],
    weight_kg: raw['weight_kg'],
    activity: raw['activity'],
    goal: raw['goal'],
    rate_kg_per_week: raw['rate_kg_per_week'],
  }

  const parsed = OnboardingSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    throw new Error(msg)
  }

  const { protein_g, carbs_g, fat_g, targetKcal } = computeMacros({
    sex: parsed.data.sex,
    age: parsed.data.age,
    height_cm: parsed.data.height_cm,
    weight_kg: parsed.data.weight_kg,
    activity: parsed.data.activity,
    goal: parsed.data.goal,
    rate_kg_per_week: parsed.data.rate_kg_per_week,
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

  // Refresh and send user back to intended page
  revalidatePath('/today')
  redirect(next)
}
