import { z } from 'zod'

export const createFoodSchema = z.object({
  name: z.string().min(1),
  kcal: z.number().int().min(0).max(2000),
  protein_g: z.number().int().min(0).max(300),
  carbs_g: z.number().int().min(0).max(300),
  fat_g: z.number().int().min(0).max(200),
  unit: z.string().min(1),
  grams_per_unit: z.number().int().min(1).max(2000),
})

export type CreateFoodInput = z.infer<typeof createFoodSchema>
