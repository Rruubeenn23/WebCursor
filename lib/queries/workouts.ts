import { createServerSupabase } from '@/lib/supabase/server'

export async function listWorkoutsForDate(date: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('workouts').select('*').eq('user_id', user.id).eq('date', date).order('created_at')
  return data ?? []
}
