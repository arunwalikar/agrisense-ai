export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      crop_history: {
        Row: {
          actual_harvest_date: string | null
          area_acres: number | null
          created_at: string
          crop_name: string
          expected_harvest_date: string | null
          farm_id: string
          id: string
          notes: string | null
          planted_date: string
          status: string | null
          updated_at: string
          user_id: string
          yield_kg: number | null
        }
        Insert: {
          actual_harvest_date?: string | null
          area_acres?: number | null
          created_at?: string
          crop_name: string
          expected_harvest_date?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          planted_date: string
          status?: string | null
          updated_at?: string
          user_id: string
          yield_kg?: number | null
        }
        Update: {
          actual_harvest_date?: string | null
          area_acres?: number | null
          created_at?: string
          crop_name?: string
          expected_harvest_date?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          planted_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          yield_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_history_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          category: string | null
          created_at: string
          days_to_harvest: number | null
          growing_season: string | null
          icon: string | null
          id: string
          name: string
          water_requirement: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          days_to_harvest?: number | null
          growing_season?: string | null
          icon?: string | null
          id?: string
          name: string
          water_requirement?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          days_to_harvest?: number | null
          growing_season?: string | null
          icon?: string | null
          id?: string
          name?: string
          water_requirement?: string | null
        }
        Relationships: []
      }
      disease_detections: {
        Row: {
          confidence: number | null
          created_at: string
          disease_name: string | null
          id: string
          image_url: string | null
          plant_name: string | null
          treatment: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          disease_name?: string | null
          id?: string
          image_url?: string | null
          plant_name?: string | null
          treatment?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          disease_name?: string | null
          id?: string
          image_url?: string | null
          plant_name?: string | null
          treatment?: string | null
          user_id?: string
        }
        Relationships: []
      }
      farm_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          crop_history_id: string | null
          description: string | null
          expense_date: string
          farm_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          crop_history_id?: string | null
          description?: string | null
          expense_date?: string
          farm_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          crop_history_id?: string | null
          description?: string | null
          expense_date?: string
          farm_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_expenses_crop_history_id_fkey"
            columns: ["crop_history_id"]
            isOneToOne: false
            referencedRelation: "crop_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_expenses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_income: {
        Row: {
          amount: number
          created_at: string
          crop_history_id: string | null
          farm_id: string | null
          id: string
          income_date: string
          source: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          crop_history_id?: string | null
          farm_id?: string | null
          id?: string
          income_date?: string
          source?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          crop_history_id?: string | null
          farm_id?: string | null
          id?: string
          income_date?: string
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_income_crop_history_id_fkey"
            columns: ["crop_history_id"]
            isOneToOne: false
            referencedRelation: "crop_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_income_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          id: string
          irrigation_type: string | null
          latitude: number
          location_name: string | null
          longitude: number
          name: string
          size_acres: number | null
          soil_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          irrigation_type?: string | null
          latitude: number
          location_name?: string | null
          longitude: number
          name: string
          size_acres?: number | null
          soil_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          irrigation_type?: string | null
          latitude?: number
          location_name?: string | null
          longitude?: number
          name?: string
          size_acres?: number | null
          soil_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          created_at: string
          id: string
          latitude: number
          location_name: string | null
          longitude: number
          name: string
          notes: string | null
          soil_data: Json | null
          soil_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          location_name?: string | null
          longitude: number
          name: string
          notes?: string | null
          soil_data?: Json | null
          soil_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          name?: string
          notes?: string | null
          soil_data?: Json | null
          soil_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          created_at: string
          crop_name: string
          id: string
          market_name: string
          price_date: string
          price_per_kg: number
        }
        Insert: {
          created_at?: string
          crop_name: string
          id?: string
          market_name: string
          price_date?: string
          price_per_kg: number
        }
        Update: {
          created_at?: string
          crop_name?: string
          id?: string
          market_name?: string
          price_date?: string
          price_per_kg?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      soil_analyses: {
        Row: {
          analysis_date: string
          created_at: string
          farm_id: string | null
          id: string
          moisture: number | null
          nitrogen: number | null
          ph: number | null
          phosphorus: number | null
          potassium: number | null
          recommendations: string | null
          soil_type: string | null
          user_id: string
        }
        Insert: {
          analysis_date?: string
          created_at?: string
          farm_id?: string | null
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          recommendations?: string | null
          soil_type?: string | null
          user_id: string
        }
        Update: {
          analysis_date?: string
          created_at?: string
          farm_id?: string | null
          id?: string
          moisture?: number | null
          nitrogen?: number | null
          ph?: number | null
          phosphorus?: number | null
          potassium?: number | null
          recommendations?: string | null
          soil_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_analyses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "farmer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "farmer"],
    },
  },
} as const
