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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      price_types: {
        Row: {
          code: string
          label: string
          description: string | null
          unit_label: string | null
          allows_products: boolean
          created_at: string
        }
        Insert: {
          code: string
          label: string
          description?: string | null
          unit_label?: string | null
          allows_products?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          label?: string
          description?: string | null
          unit_label?: string | null
          allows_products?: boolean
          created_at?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string
          base_price_type: string
          active: boolean
          base_price: number | null
          visit_price: number | null
          has_quantity_pricing: boolean
          allows_products: boolean
          price_ranges: Json
          min_price: number | null
          work_place: string | null
          previous_requirements: string | null
          products: Json
          duration: number | null
          emergency: Json
          quote_fields: Json
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string
          base_price_type?: string
          active?: boolean
          base_price?: number | null
          visit_price?: number | null
          has_quantity_pricing?: boolean
          allows_products?: boolean
          price_ranges?: Json
          min_price?: number | null
          work_place?: string | null
          previous_requirements?: string | null
          products?: Json
          duration?: number | null
          emergency?: Json
          quote_fields?: Json
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string
          base_price_type?: string
          active?: boolean
          base_price?: number | null
          visit_price?: number | null
          has_quantity_pricing?: boolean
          allows_products?: boolean
          price_ranges?: Json
          min_price?: number | null
          work_place?: string | null
          previous_requirements?: string | null
          products?: Json
          duration?: number | null
          emergency?: Json
          quote_fields?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      specialist: {
        Row: {
          id: string
          user_id: string | null
          verified: boolean
          rating: number | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          verified?: boolean
          rating?: number | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          verified?: boolean
          rating?: number | null
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_services: {
        Row: {
          id: string
          specialist_id: string | null
          service_id: string | null
          name: string | null
          description: string | null
          has_quantity_pricing: boolean
          base_price: number | null
          visit_price: number | null
          min_price: number | null
          price_ranges: Json
          duration: number | null
          emergencies: boolean
          products: Json
          previous_requirements: string | null
          active: boolean
          work_place: string | null
          created_at: string
        }
        Insert: {
          id?: string
          specialist_id?: string | null
          service_id?: string | null
          name?: string | null
          description?: string | null
          has_quantity_pricing?: boolean
          base_price?: number | null
          visit_price?: number | null
          min_price?: number | null
          price_ranges?: Json
          duration?: number | null
          emergencies?: boolean
          products?: Json
          previous_requirements?: string | null
          active?: boolean
          work_place?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          specialist_id?: string | null
          service_id?: string | null
          name?: string | null
          description?: string | null
          has_quantity_pricing?: boolean
          base_price?: number | null
          visit_price?: number | null
          min_price?: number | null
          price_ranges?: Json
          duration?: number | null
          emergencies?: boolean
          products?: Json
          previous_requirements?: string | null
          active?: boolean
          work_place?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_services_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialist"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
