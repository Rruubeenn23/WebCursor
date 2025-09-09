import { z } from 'zod'

export const createCheckinSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().nullable().optional(),
  waist_cm: z.number().nullable().optional(),
  sleep_h: z.number().nullable().optional(),
  hunger_1_5: z.number().int().min(1).max(5).nullable().optional(),
  energy_1_5: z.number().int().min(1).max(5).nullable().optional(),
  stress_1_5: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type CreateCheckinInput = z.infer<typeof createCheckinSchema>
