/**
 * Meal Plan Service
 * - Generates a simple 7-day plan (today → +6).
 * - Idempotent upsert using UNIQUE(user_id, date) on day_plans.
 * - Does not assume presence of template items to keep this deploy-safe.
 */

type SupabaseClientLike = {
  from: (table: string) => any
}

function formatISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function startOfDayUTC(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

export function getMealPlanService(supabase: SupabaseClientLike) {
  return {
    async generateWeek(userId: string) {
      const start = startOfDayUTC(new Date())
      const days: string[] = Array.from({ length: 7 }).map((_, i) =>
        formatISO(new Date(start.getTime() + i * 24 * 60 * 60 * 1000))
      )

      // Upsert day_plans for the next 7 days.
      // We set training_day true for Mon/Wed/Fri as an example; rest otherwise.
      const rows = days.map((dateISO) => {
        const weekday = new Date(dateISO + 'T00:00:00.000Z').getUTCDay() // 0 Sun ... 6 Sat
        const training = weekday === 1 || weekday === 3 || weekday === 5
        return {
          user_id: userId,
          date: dateISO,
          training_day: training,
          notes: training ? 'Entrenamiento programado' : 'Descanso',
        }
      })

      // Use upsert on (user_id, date). Your DB should have UNIQUE(user_id, date).
      const { error } = await supabase
        .from('day_plans')
        .upsert(rows, { onConflict: 'user_id,date' })

      if (error) throw error
    },
  }
}
