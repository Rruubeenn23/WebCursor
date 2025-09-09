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

  // Revalidate URL paths (not group folder names)
  revalidatePath('/plans')
  revalidatePath('/today')
}

/**
 * Mark a planned meal item as done/undone.
 * Accepts either a string id or an object { id, done? }.
 * Returns a structured result for client ergonomics.
 */
const markMealAsDoneSchema = z.object({
  id: z.string().min(1), // use z.string().uuid() if ids are UUIDs
  done: z.boolean().optional().default(true),
})

export async function markMealAsDone(
  input: { id: string; done?: boolean } | string
): Promise<{ success: boolean; error?: string }> {
  // Normalize input
  const normalized =
    typeof input === 'string' ? { id: input, done: true } : input

  const parsed = markMealAsDoneSchema.safeParse(normalized)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map(e => e.message).join(', '),
    }
  }

  try {
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

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate pages that render meals / plans
    revalidatePath('/today')
    revalidatePath('/plans')

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e?.message ?? 'Unknown error' }
  }
}
