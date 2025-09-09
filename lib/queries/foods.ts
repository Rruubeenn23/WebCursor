import { createServerSupabase } from '@/lib/supabase/server'

export async function listFoods(query?: string, limit = 50, offset = 0) {
  const supabase = createServerSupabase()
  const qb = supabase.from('foods').select('*', { count: 'exact' }).order('name').range(offset, offset + limit - 1)
  const { data, error, count } = query ? await qb.ilike('name', `%${query}%`) : await qb
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}
