import { createServerSupabase } from '@/lib/supabase/server'
import NewWorkoutForm from './workout-form'

export default async function EntrenosPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // No strong typing here since your DB types don't expose 'workouts' yet.
  const { data } = await (supabase as any)
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(20)

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Entrenos</h1>
      {/* Default to today's date string */}
      <NewWorkoutForm defaultDate={new Date().toISOString().slice(0, 10)} />
      <div className="space-y-2">
        {(data ?? []).map((w: any) => (
          <div key={w.id} className="rounded-md border p-3">
            <div className="font-medium">{w.name}</div>
            <div className="text-sm text-muted-foreground">{w.date}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
