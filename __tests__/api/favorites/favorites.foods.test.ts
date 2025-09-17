/**
 * Illustrative test. In real usage, mock Supabase client and auth.
 * Here we only check that validation works for missing fields.
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/favorites/foods/route'

describe('POST /api/favorites/foods', () => {
  it('fails without food_id or external_id', async () => {
    const req = new NextRequest('http://localhost/api/favorites/foods', {
      method: 'POST',
      body: JSON.stringify({}),
    } as any)
    const res = await POST(req as any)
    const json = await (res as any).json()
    expect((res as any).status).toBe(400)
    expect(json.error).toBeDefined()
  })
})
