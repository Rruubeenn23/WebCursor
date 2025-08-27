import { 
  calculateFoodMacros, 
  adjustMacrosForDay, 
  calculateRemainingMacros,
  calculateProgress 
} from '@/lib/utils'

describe('Macro Calculations', () => {
  const sampleFood = {
    id: '1',
    name: 'Pollo',
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    unit: '100g',
    grams_per_unit: 100,
  }

  const sampleGoals = {
    kcal: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  }

  describe('calculateFoodMacros', () => {
    it('should calculate macros for given quantity', () => {
      const result = calculateFoodMacros(sampleFood, 2)
      
      expect(result.kcal).toBe(330)
      expect(result.protein).toBe(62)
      expect(result.carbs).toBe(0)
      expect(result.fat).toBe(7.2)
    })

    it('should handle decimal quantities', () => {
      const result = calculateFoodMacros(sampleFood, 0.5)
      
      expect(result.kcal).toBe(83)
      expect(result.protein).toBe(15.5)
      expect(result.carbs).toBe(0)
      expect(result.fat).toBe(1.8)
    })
  })

  describe('adjustMacrosForDay', () => {
    it('should increase carbs and decrease fat for training days', () => {
      const result = adjustMacrosForDay(sampleGoals, true)
      
      expect(result.kcal).toBe(2000)
      expect(result.protein).toBe(150)
      expect(result.carbs).toBe(230) // +15%
      expect(result.fat).toBe(59) // -10%
    })

    it('should keep base macros for rest days', () => {
      const result = adjustMacrosForDay(sampleGoals, false)
      
      expect(result.kcal).toBe(2000)
      expect(result.protein).toBe(150)
      expect(result.carbs).toBe(200)
      expect(result.fat).toBe(68) // +5%
    })
  })

  describe('calculateRemainingMacros', () => {
    it('should calculate remaining macros correctly', () => {
      const consumed = {
        kcal: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
      }
      
      const result = calculateRemainingMacros(sampleGoals, consumed)
      
      expect(result.kcal).toBe(1500)
      expect(result.protein).toBe(120)
      expect(result.carbs).toBe(150)
      expect(result.fat).toBe(45)
    })

    it('should not return negative values', () => {
      const consumed = {
        kcal: 2500,
        protein: 200,
        carbs: 300,
        fat: 100,
      }
      
      const result = calculateRemainingMacros(sampleGoals, consumed)
      
      expect(result.kcal).toBe(0)
      expect(result.protein).toBe(0)
      expect(result.carbs).toBe(0)
      expect(result.fat).toBe(0)
    })
  })

  describe('calculateProgress', () => {
    it('should calculate progress percentage correctly', () => {
      expect(calculateProgress(50, 100)).toBe(50)
      expect(calculateProgress(25, 100)).toBe(25)
      expect(calculateProgress(100, 100)).toBe(100)
    })

    it('should handle zero target', () => {
      expect(calculateProgress(50, 0)).toBe(0)
    })

    it('should cap at 100%', () => {
      expect(calculateProgress(150, 100)).toBe(100)
    })

    it('should not return negative values', () => {
      expect(calculateProgress(-10, 100)).toBe(0)
    })
  })
})
