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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
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
          training_day?: boolean
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
      // Add other tables as needed...
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
