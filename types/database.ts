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
    }
  }
}
