import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(1, 'q is required'),
  page_size: z.coerce.number().min(1).max(50).default(15),
})

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    q: url.searchParams.get('q'),
    page_size: url.searchParams.get('page_size') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.format() }, { status: 400 })
  }

  const { q, page_size } = parsed.data
  const apiUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl')
  apiUrl.searchParams.set('search_terms', q)
  apiUrl.searchParams.set('search_simple', '1')
  apiUrl.searchParams.set('action', 'process')
  apiUrl.searchParams.set('json', '1')
  apiUrl.searchParams.set('page_size', String(page_size))

  const r = await fetch(apiUrl.toString(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `Source error ${r.status}` }, { status: 502 })
  }
  const data = await r.json()

  const items = Array.isArray((data as any).products) ? (data as any).products : []
  const mapped = items.map((p: any) => ({
    external_id: p.code ?? p.id ?? p._id ?? null,
    source: 'openfoodfacts' as const,
    name: p.product_name || p.generic_name || p.brands || 'Producto',
    brand: p.brands || null,
    image: p.image_front_small_url || p.image_url || null,
    per_100g: {
      kcal: p.nutriments?.['energy-kcal_100g'] ?? null,
      protein_g: p.nutriments?.['proteins_100g'] ?? null,
      carbs_g: p.nutriments?.['carbohydrates_100g'] ?? null,
      fat_g: p.nutriments?.['fat_100g'] ?? null,
    },
    payload: p,
  }))

  return NextResponse.json({ ok: true, data: mapped })
}
