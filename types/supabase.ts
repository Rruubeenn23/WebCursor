export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          tz: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          tz?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          tz?: string
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          kcal: number
          protein: number
          carbs: number
          fat: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kcal: number
          protein: number
          carbs: number
          fat: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kcal?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
          updated_at?: string
        }
      }
      foods: {
        Row: {
          id: string
          name: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          unit: string
          grams_per_unit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          kcal: number
          protein_g: number
          carbs_g: number
          fat_g: number
          unit: string
          grams_per_unit: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          kcal?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          unit?: string
          grams_per_unit?: number
          created_at?: string
          updated_at?: string
        }
      }
      meal_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_template_items: {
        Row: {
          id: string
          template_id: string
          food_id: string
          qty_units: number
          time_hint: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          food_id: string
          qty_units: number
          time_hint?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          food_id?: string
          qty_units?: number
          time_hint?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      day_plans: {
        Row: {
          id: string
          user_id: string
          date: string
          template_id: string | null
          training_day: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          template_id?: string | null
          training_day: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          template_id?: string | null
          training_day?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      day_plan_items: {
        Row: {
          id: string
          day_plan_id: string
          food_id: string
          qty_units: number
          time: string
          done: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_plan_id: string
          food_id: string
          qty_units: number
          time: string
          done?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_plan_id?: string
          food_id?: string
          qty_units?: number
          time?: string
          done?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_gym: boolean
          is_boxing: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_gym?: boolean
          is_boxing?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_gym?: boolean
          is_boxing?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          muscle: string
          default_sets: number
          default_reps: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          muscle: string
          default_sets: number
          default_reps: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          muscle?: string
          default_sets?: number
          default_reps?: number
          created_at?: string
          updated_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number
          rir: number | null
          rest_seconds: number | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          sets: number
          reps: number
          rir?: number | null
          rest_seconds?: number | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          sets?: number
          reps?: number
          rir?: number | null
          rest_seconds?: number | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      schedule: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          workout_id: string | null
          meal_template_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          workout_id?: string | null
          meal_template_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          workout_id?: string | null
          meal_template_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      logs_meals: {
        Row: {
          id: string
          user_id: string
          food_id: string
          qty_units: number
          meal_type: string
          logged_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          food_id: string
          qty_units: number
          meal_type: string
          logged_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          food_id?: string
          qty_units?: number
          meal_type?: string
          logged_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
