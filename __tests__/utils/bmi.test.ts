import { calculateBMI, getBMICategory } from '@/lib/utils'

describe('BMI calculations', () => {
  it('should calculate BMI for given height and weight', () => {
    expect(calculateBMI(70, 175)).toBe(22.9)
  })

  it('should return correct BMI categories', () => {
    expect(getBMICategory(17)).toBe('Bajo peso')
    expect(getBMICategory(22)).toBe('Normal')
    expect(getBMICategory(27)).toBe('Sobrepeso')
    expect(getBMICategory(32)).toBe('Obesidad')
  })

  it('should handle invalid height', () => {
    expect(calculateBMI(70, 0)).toBe(0)
  })
})
