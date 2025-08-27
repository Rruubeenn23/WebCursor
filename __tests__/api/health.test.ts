import { NextRequest } from 'next/server'
import { GET } from '@/app/api/health/route'

describe('/api/health', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('version', '1.0.0')
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })
})
