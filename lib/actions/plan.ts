'use server'

import { cookies } from 'next/headers'
import { z } from 'zod'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

/**
 * State returned to the client via useFormState
 */
export type PlanMyDayState = {
  ok: boolean
  error?: string
  date?: string
  planId?: string
  createdCount?: number
  items?: Array<{
    id: string
    time: string
    qty_units: number
    food: { name: string; unit: string; kcal: number }
  }>
  shopping?: Array<{ name: string; unit: string; qty_units: number }>
}

const initialState: PlanMyDayState = { ok: false }

export const planFormSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'),
  mode: z.enum(['replace', 'append']).default('replace'),
  training_day: z
    .union([z.literal('on'), z.literal('true'), z.literal('false')])
    .optional()
})

/**
 * Rule-based "Plan my day" generator.
 * - Ensures a day_plan exists for the date
 * - (Optional) clears existing items when mode='replace'
 * - Picks 4 foods from `foods` and allocates target kcal per meal
 * - Inserts into day_plan_items with sensible times
 * - Returns created items and a shopping list
 */
export async function planMyDay(
  _prevState: PlanMyDayState,
  formData: FormData
): Promise<PlanMyDayState> {
  const supabase = createServerActionClient<Database>({ cookies })

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'No autenticado' }
  }

  // Validate form
  const parsed = planFormSchema.safeParse({
    date: formData.get('date') ?? '',
    mode: formData.get('mode') ?? 'replace',
    training_day: formData.get('training_day') ?? 'false'
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const input = parsed.data
  const isTrainingDay =
    input.training_day === 'on' || input.training_day === 'true'

  // Fetch latest goals for kcal baseline
  const { data: goal } = await supabase
    .from('goals')
    .select('kcal_target, protein_g, carbs_g, fat_g')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const dailyKcal = Math.max(1200, Number(goal?.kcal_target ?? 2000))

  // Ensure day_plans row
  let planId: string | null = null
  {
    const { data: planRow, error } = await supabase
      .from('day_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', input.date)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // not-found is not an error for maybeSingle
      return { ok: false, error: `Error buscando plan: ${error.message}` }
    }

    if (planRow?.id) {
      planId = planRow.id
      // Update training_day if changed
      await supabase
        .from('day_plans')
        .update({ training_day: isTrainingDay })
        .eq('id', planId)
    } else {
      const { data: created, error: createErr } = await supabase
        .from('day_plans')
        .insert({
          user_id: user.id,
          date: input.date,
          training_day: isTrainingDay
        })
        .select('id')
        .single()

      if (createErr) {
        return { ok: false, error: `Error creando plan: ${createErr.message}` }
      }
      planId = created.id
    }
  }

  if (!planId) return { ok: false, error: 'No se pudo resolver el plan' }

  // Optional: clear existing items if mode = replace
  if (input.mode === 'replace') {
    const { error: delErr } = await supabase
      .from('day_plan_items')
      .delete()
      .eq('day_plan_id', planId)
    if (delErr) return { ok: false, error: `Error limpiando items: ${delErr.message}` }
  }

  // Choose foods
  // Try to fetch a variety: high protein, high carbs, high fat, fallback
  // If your foods table is small, fallback to "top kcal" distinct picks.
  const picks: Array<{
    id: string
    name: string
    unit: string
    kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }> = []

  async function pickFood(where: string, excludeIds: string[] = []) {
    const neq = excludeIds.length ? `&id=not.in.(${excludeIds.map((x) => `"${x}"`).join(',')})` : ''
    // Build a PostgREST filter: we’ll call via supabase client with eq / order
    // but we need a simple single-row pick. Use a normal query + order.
    const { data } = await supabase
      .from('foods')
      .select('id,name,unit,kcal,protein_g,carbs_g,fat_g')
      .order(where as any, { ascending: false })
      .limit(5)
    const chosen = (data ?? []).find((f) => !excludeIds.includes(f.id))
    if (chosen) picks.push(chosen as any)
  }

  await pickFood('protein_g')
  await pickFood('carbs_g', picks.map((p) => p.id))
  await pickFood('fat_g', picks.map((p) => p.id))
  if (picks.length < 3) {
    // fallback: just take some foods
    const { data } = await supabase
      .from('foods')
      .select('id,name,unit,kcal,protein_g,carbs_g,fat_g')
      .limit(4)
    for (const f of data ?? []) {
      if (!picks.find((p) => p.id === f.id)) picks.push(f as any)
      if (picks.length >= 4) break
    }
  }
  // Ensure at least 4 picks by duplicating the first if needed
  while (picks.length < 4 && picks.length > 0) picks.push(picks[0])

  if (picks.length === 0) {
    return {
      ok: false,
      error: 'No hay alimentos en la base de datos. Crea algunos en Comidas.'
    }
  }

  // Meal time slots and kcal splits
  const times = ['08:00', '13:30', '17:30', '21:00']
  const splits = [0.25, 0.35, 0.15, 0.25]
  const plannedItems: Array<{
    time: string
    qty_units: number
    food_id: string
    food: { name: string; unit: string; kcal: number }
  }> = []

  for (let i = 0; i < Math.min(times.length, picks.length); i++) {
    const f = picks[i]
    const mealKcal = Math.max(150, Math.round(dailyKcal * splits[i]))
    // qty by kcal per unit; round to nearest 0.5
    const rawQty = f.kcal > 0 ? mealKcal / f.kcal : 1
    const qtyUnits = Math.max(0.5, Math.round(rawQty * 2) / 2)

    plannedItems.push({
      time: times[i],
      qty_units: qtyUnits,
      food_id: f.id,
      food: { name: f.name, unit: f.unit, kcal: f.kcal }
    })
  }

  // Insert items (append or newly cleared)
  const { data: inserted, error: insErr } = await supabase
    .from('day_plan_items')
    .insert(
      plannedItems.map((p) => ({
        day_plan_id: planId!,
        food_id: p.food_id,
        qty_units: p.qty_units,
        time: p.time,
        done: false,
        entry_type: 'food'
      }))
    )
    .select('id, qty_units, time, foods(name, unit, kcal)')
  if (insErr) {
    return { ok: false, error: `Error creando items: ${insErr.message}` }
  }

  // Build shopping list aggregation
  const itemsForClient =
    (inserted ?? []).map((row) => ({
      id: row.id as string,
      time: row.time as string,
      qty_units: Number(row.qty_units),
      food: {
        name: (row as any).foods?.name as string,
        unit: (row as any).foods?.unit as string,
        kcal: Number((row as any).foods?.kcal ?? 0)
      }
    })) || []

  const shoppingMap = new Map<string, { name: string; unit: string; qty_units: number }>()
  for (const it of itemsForClient) {
    const key = `${it.food.name}|${it.food.unit}`
    const prev = shoppingMap.get(key)
    if (prev) {
      prev.qty_units += it.qty_units
    } else {
      shoppingMap.set(key, {
        name: it.food.name,
        unit: it.food.unit,
        qty_units: it.qty_units
      })
    }
  }

  return {
    ok: true,
    date: input.date,
    planId: planId!,
    createdCount: itemsForClient.length,
    items: itemsForClient,
    shopping: Array.from(shoppingMap.values())
  }
}

export const initialPlanState = initialState
