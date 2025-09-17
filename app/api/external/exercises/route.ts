import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(1, 'q is required'),
  limit: z.coerce.number().min(1).max(50).default(15),
})

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q'),
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
  }
  const { q, limit } = parsed.data

  const apiUrl = new URL('https://wger.de/api/v2/exercise/')
  apiUrl.searchParams.set('language', '2') // English
  apiUrl.searchParams.set('search', q)
  apiUrl.searchParams.set('limit', String(limit))

  const r = await fetch(apiUrl.toString(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `Source error ${r.status}` }, { status: 502 })
  }
  const data = await r.json()
  const results = Array.isArray((data as any).results) ? (data as any).results : []

  const mapped = results.map((e: any) => ({
    external_id: String(e.id),
    source: 'wger' as const,
    name: e.name,
    description: e.description,
    category: e.category?.name ?? null,
    muscles: e.muscles ?? [],
    payload: e,
  }))

  return NextResponse.json({ ok: true, data: mapped })
}
