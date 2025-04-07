export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      administrators: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          username?: string
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          exchange_rate: number
          id: string
          is_active: boolean
          is_base: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          exchange_rate: number
          id?: string
          is_active?: boolean
          is_base?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          exchange_rate?: number
          id?: string
          is_active?: boolean
          is_base?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      limitation_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_numeric: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_numeric?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_numeric?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          name: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          name: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          name?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tariff_items: {
        Row: {
          created_at: string
          description: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tariff_plan_items: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          tariff_item_id: string
          tariff_plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          tariff_item_id: string
          tariff_plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          tariff_item_id?: string
          tariff_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tariff_plan_items_tariff_item_id_fkey"
            columns: ["tariff_item_id"]
            isOneToOne: false
            referencedRelation: "tariff_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tariff_plan_items_tariff_plan_id_fkey"
            columns: ["tariff_plan_id"]
            isOneToOne: false
            referencedRelation: "tariff_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tariff_plan_limitations: {
        Row: {
          created_at: string
          id: string
          limitation_type_id: string
          suppliers_count: boolean | null
          tariff_plan_id: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          limitation_type_id: string
          suppliers_count?: boolean | null
          tariff_plan_id: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          limitation_type_id?: string
          suppliers_count?: boolean | null
          tariff_plan_id?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "tariff_plan_limitations_limitation_type_id_fkey"
            columns: ["limitation_type_id"]
            isOneToOne: false
            referencedRelation: "limitation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tariff_plan_limitations_tariff_plan_id_fkey"
            columns: ["tariff_plan_id"]
            isOneToOne: false
            referencedRelation: "tariff_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tariff_plans: {
        Row: {
          created_at: string
          currency_id: string
          duration_days: number | null
          id: string
          is_permanent: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_id: string
          duration_days?: number | null
          id?: string
          is_permanent?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_id?: string
          duration_days?: number | null
          id?: string
          is_permanent?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tariff_plans_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stores: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tariff_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          start_date: string
          tariff_plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          tariff_plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          start_date?: string
          tariff_plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tariff_subscriptions_tariff_plan_id_fkey"
            columns: ["tariff_plan_id"]
            isOneToOne: false
            referencedRelation: "tariff_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tariff_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          username?: string
        }
        Relationships: []
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
