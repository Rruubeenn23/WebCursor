import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types for nutrition and fitness data
export interface MacroGoals {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface MacroAdjustments {
  trainingCarbsIncrease: number // percentage
  trainingFatDecrease: number // percentage
  restFatIncrease: number // percentage
}

export interface FoodItem {
  id: string
  name: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  unit: string
  grams_per_unit: number
}

export interface MealTemplateItem {
  food_id: string
  qty_units: number
  time_hint?: string
}

// Calculate macros for a given quantity of food
export function calculateFoodMacros(food: FoodItem, qty_units: number) {
  return {
    kcal: Math.round(food.kcal * qty_units),
    protein: Math.round(food.protein * qty_units * 10) / 10,
    carbs: Math.round(food.carbs * qty_units * 10) / 10,
    fat: Math.round(food.fat * qty_units * 10) / 10,
  }
}

// Adjust macros based on training day
export function adjustMacrosForDay(
  baseGoals: MacroGoals,
  isTrainingDay: boolean,
  adjustments: MacroAdjustments = {
    trainingCarbsIncrease: 15,
    trainingFatDecrease: 10,
    restFatIncrease: 5,
  }
): MacroGoals {
  if (isTrainingDay) {
    return {
      kcal: baseGoals.kcal,
      protein: baseGoals.protein,
      carbs: Math.round(baseGoals.carbs * (1 + adjustments.trainingCarbsIncrease / 100)),
      fat: Math.round(baseGoals.fat * (1 - adjustments.trainingFatDecrease / 100)),
    }
  } else {
    return {
      kcal: baseGoals.kcal,
      protein: baseGoals.protein,
      carbs: baseGoals.carbs,
      fat: Math.round(baseGoals.fat * (1 + adjustments.restFatIncrease / 100)),
    }
  }
}

// Calculate remaining macros
export function calculateRemainingMacros(
  goals: MacroGoals,
  consumed: MacroGoals
): MacroGoals {
  return {
    kcal: Math.max(0, goals.kcal - consumed.kcal),
    protein: Math.max(0, goals.protein - consumed.protein),
    carbs: Math.max(0, goals.carbs - consumed.carbs),
    fat: Math.max(0, goals.fat - consumed.fat),
  }
}

// Calculate progress percentage
export function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0
  return Math.min(100, Math.max(0, (current / target) * 100))
}

// Format time for display
export function formatTime(time: string): string {
  return time.substring(0, 5) // HH:MM format
}

// Get current date in Europe/Madrid timezone
export function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'Europe/Madrid'
  })
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Europe/Madrid'
  })
}

// Check if date is today
export function isToday(date: string): boolean {
  return date === getCurrentDate()
}

// Get day name in Spanish
export function getDayName(date: string): string {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dayIndex = new Date(date).getDay()
  return dayNames[dayIndex]
}

// Calculate Body Mass Index
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  if (heightM <= 0) return 0
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

// Get BMI category in Spanish
export function getBMICategory(bmi: number): string {
  if (bmi === 0) return 'Desconocido'
  if (bmi < 18.5) return 'Bajo peso'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Sobrepeso'
  return 'Obesidad'
}
