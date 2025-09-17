/**
 * Minimal smoke test for the external foods endpoint.
 * In CI, you may want to mock fetch; here we just assert shape.
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/external/foods/route'

function makeRequest(search: string) {
  return new NextRequest(`http://localhost/api/external/foods?${search}`)
}

describe('GET /api/external/foods', () => {
  it('returns mapped Open Food Facts results', async () => {
    const res = await GET(makeRequest('q=pollo&page_size=3') as any)
    const json = await (res as any).json()
    expect(json).toHaveProperty('data')
    expect(Array.isArray(json.data)).toBe(true)
  })
})
