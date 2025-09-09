import { todayISO } from '@/lib/utils'

describe('utils', () => {
  it('todayISO returns YYYY-MM-DD', () => {
    const s = todayISO()
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
