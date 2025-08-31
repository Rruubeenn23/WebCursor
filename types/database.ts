import type { PostgrestError } from '@supabase/supabase-js'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          tz: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          tz?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          tz?: string
          created_at?: string
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
      },
      water_logs: {
        Row: {
          id: string
          user_id: string
          ml: number
          logged_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ml: number
          logged_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ml?: number
          logged_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
