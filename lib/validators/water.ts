import { z } from 'zod'

export const addWaterSchema = z.object({
  ml: z.number().int().min(1).max(5000),
})

export type AddWaterInput = z.infer<typeof addWaterSchema>
