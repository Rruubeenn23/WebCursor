import { z } from 'zod'

export const createWorkoutSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>
