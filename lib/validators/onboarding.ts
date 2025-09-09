import { z } from 'zod'

export const OnboardingSchema = z.object({
  sex: z.enum(['male', 'female']),
  age: z.coerce.number().int().min(14).max(100),
  height_cm: z.coerce.number().min(120).max(250),
  weight_kg: z.coerce.number().min(35).max(300),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['cut', 'maintain', 'bulk']),
  // Negative for cut (e.g., -0.5 kg/week), 0 for maintain, positive for bulk.
  rate_kg_per_week: z.coerce.number().min(-1.5).max(1.0),
})
export type OnboardingInput = z.infer<typeof OnboardingSchema>
