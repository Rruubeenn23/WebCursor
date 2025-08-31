import { calculateBMR, calculateTDEE } from '@/lib/utils'

describe('BMR calculations', () => {
  it('calculates BMR for males and females', () => {
    expect(
      calculateBMR({ weightKg: 70, heightCm: 175, age: 30, sex: 'male' })
    ).toBe(1649)
    expect(
      calculateBMR({ weightKg: 60, heightCm: 165, age: 30, sex: 'female' })
    ).toBe(1320)
  })

  it('calculates TDEE based on activity level', () => {
    expect(calculateTDEE(1600, 'sedentary')).toBe(1920)
    expect(calculateTDEE(1600, 'moderate')).toBe(2480)
  })
})
