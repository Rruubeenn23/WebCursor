import { createServerSupabase } from '@/lib/supabase/server'
import NewWorkoutForm from './workout-form'
import ExercisesExplorer from '@/components/exercises/exercises-explorer'
import { redirect } from 'next/navigation'

export default async function EntrenosPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data:{ session } } = await supabase.auth.getSession();
  if(!session) redirect('/');
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
  return (<div className='mx-auto max-w-3xl p-4 space-y-6'>
    <h1 className='text-2xl font-semibold'>Entrenos</h1>
    <p className='text-sm text-muted-foreground'>Busca ejercicios y guarda favoritos.</p>
    <ExercisesExplorer />
  </div>)

  // No strong typing here since your DB types don't expose 'workouts' yet.
  
}
