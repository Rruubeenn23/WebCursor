export type Sex = 'male' | 'female'
export type Activity =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'

export type GoalType = 'cut' | 'maintain' | 'bulk'

export interface MacroResult {
  bmr: number
  tdee: number
  targetKcal: number
  protein_g: number
  fat_g: number
  carbs_g: number
}

const ACTIVITY_MULTIPLIER: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

/**
 * Mifflin–St Jeor BMR (metric)
 */
export function bmrMifflin({
  sex,
  weight_kg,
  height_cm,
  age,
}: {
  sex: Sex
  weight_kg: number
  height_cm: number
  age: number
}): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

/**
 * Compute kcal delta per day from desired weekly bodyweight change.
 * 1 kg of fat ~ 7700 kcal (rough heuristic).
 */
export function kcalDeltaPerDay(rateKgPerWeek: number): number {
  const kcalPerKg = 7700
  return (rateKgPerWeek * kcalPerKg) / 7
}

/**
 * Compute macros from inputs.
 * - Protein g/kg: cut 2.2, maintain 2.0, bulk 1.8
 * - Fat g/kg: min 0.8 g/kg
 * - Remaining kcal → carbs
 */
export function computeMacros({
  sex,
  age,
  height_cm,
  weight_kg,
  activity,
  goal,
  rate_kg_per_week,
}: {
  sex: Sex
  age: number
  height_cm: number
  weight_kg: number
  activity: Activity
  goal: GoalType
  rate_kg_per_week: number // negative for cut, zero for maintain, positive for bulk
}): MacroResult {
  const bmr = bmrMifflin({ sex, weight_kg, height_cm, age })
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activity])

  // Apply daily kcal delta from weekly rate
  const delta = kcalDeltaPerDay(rate_kg_per_week)
  const targetKcal = Math.max(1200, Math.round(tdee + delta)) // guardrail: 1200 kcal floor

  // Protein per kg by goal
  const proteinPerKg = goal === 'cut' ? 2.2 : goal === 'bulk' ? 1.8 : 2.0
  const fatPerKg = 0.8

  let protein_g = Math.round(proteinPerKg * weight_kg)
  let fat_g = Math.round(fatPerKg * weight_kg)

  const kcalFromProtein = protein_g * 4
  const kcalFromFat = fat_g * 9
  let remainingKcal = targetKcal - (kcalFromProtein + kcalFromFat)

  // If negative (aggressive cut), reduce fat down to 0.6 g/kg before touching protein
  if (remainingKcal < 0) {
    const minFat = Math.round(0.6 * weight_kg)
    if (fat_g > minFat) {
      const drop = Math.min(fat_g - minFat, Math.ceil(Math.abs(remainingKcal) / 9))
      fat_g -= drop
      remainingKcal += drop * 9
    }
  }

  const carbs_g = Math.max(0, Math.round(remainingKcal / 4))

  return {
    bmr,
    tdee,
    targetKcal,
    protein_g,
    fat_g,
    carbs_g,
  }
}
