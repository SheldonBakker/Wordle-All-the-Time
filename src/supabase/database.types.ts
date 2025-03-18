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
      user_stats: {
        Row: {
          id: string
          games_played: number
          games_won: number
          current_streak: number
          max_streak: number
          guess_distribution: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          games_played?: number
          games_won?: number
          current_streak?: number
          max_streak?: number
          guess_distribution?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          games_played?: number
          games_won?: number
          current_streak?: number
          max_streak?: number
          guess_distribution?: Json
          created_at?: string
          updated_at?: string
        }
      }
      game_history: {
        Row: {
          id: string
          user_id: string
          target_word: string
          attempts: number
          won: boolean
          grid: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_word: string
          attempts: number
          won: boolean
          grid: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_word?: string
          attempts?: number
          won?: boolean
          grid?: Json
          created_at?: string
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