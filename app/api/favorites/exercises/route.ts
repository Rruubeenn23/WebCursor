import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'

const createSchema = z.object({
  exercise_id: z.string().uuid().optional(),
  external_id: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  payload: z.any().optional()
}).refine((val) => val.exercise_id || val.external_id, {
  message: 'Either exercise_id or external_id is required'
})

const deleteSchema = z.object({
  id: z.string().uuid()
})

export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('favorites_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('favorites_exercises')
    .insert({
      user_id: user.id,
      exercise_id: parsed.data.exercise_id ?? null,
      external_id: parsed.data.external_id ?? null,
      source: parsed.data.source ?? null,
      payload: parsed.data.payload ?? null
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const parsed = deleteSchema.safeParse({ id: url.searchParams.get('id') })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('favorites_exercises')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
