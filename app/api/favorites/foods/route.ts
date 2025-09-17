import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'

const createSchema = z
  .object({
    food_id: z.string().uuid().optional(),
    external_id: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
    payload: z.any().optional(),
  })
  .refine((v) => v.food_id || v.external_id, {
    message: 'Provide food_id or external_id',
  })

const deleteSchema = z.object({
  id: z.string().uuid(),
})

export const runtime = 'nodejs'

export async function GET() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('favorites_foods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('favorites_foods')
    .insert({
      user_id: user.id,
      food_id: parsed.data.food_id ?? null,
      external_id: parsed.data.external_id ?? null,
      source: parsed.data.source ?? null,
      payload: parsed.data.payload ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const parsed = deleteSchema.safeParse({ id: url.searchParams.get('id') })
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
  }

  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('favorites_foods')
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
