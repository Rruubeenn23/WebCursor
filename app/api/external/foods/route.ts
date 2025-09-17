import { NextResponse } from 'next/server'
import { z } from 'zod'

// wger offers exercise database publicly.
// language=2 -> English (change if you need Spanish content later)
const querySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function GET(req: Request) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q'),
    limit: url.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { q, limit } = parsed.data
  const apiUrl = new URL('https://wger.de/api/v2/exercise/')
  apiUrl.searchParams.set('language', '2')
  apiUrl.searchParams.set('search', q)
  apiUrl.searchParams.set('limit', String(limit))

  const r = await fetch(apiUrl.toString(), {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' }
  })
  if (!r.ok) {
    return NextResponse.json({ error: `External source error (${r.status})` }, { status: 502 })
  }
  const data = await r.json() as any
  const results = Array.isArray(data.results) ? data.results : []

  const mapped = results.map((e: any) => ({
    external_id: String(e.id),
    source: 'wger' as const,
    name: e.name,
    description: e.description,
    category: e.category?.name ?? null,
    muscles: e.muscles ?? [],
    payload: e,
  }))

  return NextResponse.json({ data: mapped })
}
