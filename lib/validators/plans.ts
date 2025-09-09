import { z } from 'zod'

export const dayPlanForDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export type DayPlanForDateInput = z.infer<typeof dayPlanForDateSchema>
