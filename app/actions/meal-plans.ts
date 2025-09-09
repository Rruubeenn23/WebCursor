'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMealPlanService } from '@/lib/services/mealPlanService'

/**
 * Generate (or upsert) a 7-day plan starting today for the logged-in user.
 * Idempotent: re-running will not duplicate entries because of (user_id, date) unique.
 */
export async function generateWeeklyPlan() {
  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr) throw authErr
  if (!user) throw new Error('Unauthorized')

  const svc = getMealPlanService(supabase)
  await svc.generateWeek(user.id)

  // Revalidate any pages that show plans
  revalidatePath('/(app)/plan')
  revalidatePath('/(app)/today')
}
