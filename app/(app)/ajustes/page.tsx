import { createServerSupabase } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type UserRow = Database['public']['Tables']['users']['Row']

export default async function AjustesPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('email, tz, created_at')
    .eq('id', user.id)
    .single()
    .returns<Pick<UserRow, 'email' | 'tz' | 'created_at'>>()

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      <div className="rounded-md border p-3 space-y-2">
        <div className="text-sm"><span className="font-medium">Email:</span> {profile?.email ?? user.email}</div>
        <div className="text-sm"><span className="font-medium">Zona horaria:</span> {profile?.tz ?? 'Europe/Madrid'}</div>
        <div className="text-sm text-muted-foreground">Cuenta creada: {profile?.created_at}</div>
      </div>
    </div>
  )
}
