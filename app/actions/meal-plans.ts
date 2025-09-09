'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { getMealPlanService } from '@/lib/services/mealPlanService'

/**
 * Generate (or upsert) a 7-day plan starting today for the logged-in user.
 * Idempotent thanks to UNIQUE(user_id, date) on day_plans.
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

/**
 * Mark a planned meal item as done/undone.
 * Expects the id of a row in public.day_plan_items.
 */
const markMealAsDoneSchema = z.object({
  id: z.string().min(1), // use .uuid() if your ids are UUIDs
  done: z.boolean().optional().default(true),
})

export async function markMealAsDone(input: { id: string; done?: boolean }) {
  const parsed = markMealAsDoneSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map(e => e.message).join(', '))
  }

  const supabase = createServerSupabase()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr) throw authErr
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('day_plan_items')
    .update({ done: parsed.data.done })
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) throw error

  // Revalidate pages that render meals / plans
  revalidatePath('/(app)/today')
  revalidatePath('/(app)/plan')
}
