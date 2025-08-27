import { z } from 'zod'

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

// Nutrition schemas
export const macroGoalsSchema = z.object({
  kcal_target: z.number().min(1000).max(10000),
  protein_g: z.number().min(50).max(500),
  carbs_g: z.number().min(50).max(1000),
  fat_g: z.number().min(20).max(200),
  weight_target: z.number().optional(),
})

export const foodSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  kcal: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  unit: z.string().min(1, 'La unidad es requerida'),
  grams_per_unit: z.number().min(0),
})

export const mealTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

export const mealTemplateItemSchema = z.object({
  food_id: z.string().uuid(),
  qty_units: z.number().min(0.1),
  time_hint: z.string().optional(),
})

// Workout schemas
export const workoutSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  focus: z.string().min(1, 'El enfoque es requerido'),
  duration_min: z.number().min(10).max(300),
})

export const exerciseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  muscle: z.string().min(1, 'El músculo es requerido'),
  default_sets: z.number().min(1).max(20),
  default_reps: z.number().min(1).max(100),
})

export const workoutExerciseSchema = z.object({
  workout_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  order_i: z.number().min(0),
  sets: z.number().min(1).max(20),
  reps: z.number().min(1).max(100),
  rir: z.number().min(0).max(5),
  rest_sec: z.number().min(0).max(600),
})

// Plan schemas
export const createPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  training_day: z.boolean(),
  template_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})

export const dayPlanItemSchema = z.object({
  food_id: z.string().uuid(),
  qty_units: z.number().min(0.1),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  done: z.boolean().default(false),
})

// Schedule schemas
export const scheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  workout_id: z.string().uuid(),
  status: z.enum(['planned', 'done', 'skipped']),
})

// API schemas
export const mealDoneSchema = z.object({
  day_plan_item_id: z.string().uuid(),
})

export const healthCheckSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  version: z.string(),
})

// Settings schemas
export const userSettingsSchema = z.object({
  tz: z.string().default('Europe/Madrid'),
  notifications_enabled: z.boolean().default(true),
  telegram_chat_id: z.string().optional(),
  macro_adjustments: z.object({
    training_carbs_increase: z.number().min(0).max(50).default(15),
    training_fat_decrease: z.number().min(0).max(50).default(10),
    rest_fat_increase: z.number().min(0).max(50).default(5),
  }).default({}),
})

// Log schemas
export const mealLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  kcal: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  source: z.string().min(1, 'La fuente es requerida'),
})
