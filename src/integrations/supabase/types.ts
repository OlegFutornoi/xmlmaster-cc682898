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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      parsed_xml_data: {
        Row: {
          categories: Json | null
          created_at: string
          currencies: Json | null
          file_name: string
          id: string
          offers: Json | null
          parsed_data: Json
          raw_xml: string | null
          shop_info: Json | null
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          categories?: Json | null
          created_at?: string
          currencies?: Json | null
          file_name: string
          id?: string
          offers?: Json | null
          parsed_data: Json
          raw_xml?: string | null
          shop_info?: Json | null
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          categories?: Json | null
          created_at?: string
          currencies?: Json | null
          file_name?: string
          id?: string
          offers?: Json | null
          parsed_data?: Json
          raw_xml?: string | null
          shop_info?: Json | null
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_xml_data_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string | null
          created_at: string
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          attribute_name: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          attribute_name?: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          name: string
          store_id: string | null
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          name: string
          store_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          name?: string
          store_id?: string | null
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "user_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_main: boolean | null
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_main?: boolean | null
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_main?: boolean | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          external_id: string | null
          id: string
          is_active: boolean
          name: string
          old_price: number | null
          price: number | null
          sale_price: number | null
          sku: string | null
          stock_quantity: number | null
          store_id: string
          supplier_id: string
          updated_at: string
          user_id: string
          vendor: string | null
          vendor_code: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          old_price?: number | null
          price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          store_id: string
          supplier_id: string
          updated_at?: string
          user_id: string
          vendor?: string | null
          vendor_code?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          old_price?: number | null
          price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string
          supplier_id?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
          vendor_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "user_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      store_template_parameters: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          is_required: boolean
          nested_values: Json | null
          parameter_category: string
          parameter_name: string
          parameter_type: string
          parameter_value: string | null
          parent_parameter: string | null
          store_id: string
          template_id: string
          updated_at: string
          xml_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          nested_values?: Json | null
          parameter_category?: string
          parameter_name: string
          parameter_type?: string
          parameter_value?: string | null
          parent_parameter?: string | null
          store_id: string
          template_id: string
          updated_at?: string
          xml_path: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          nested_values?: Json | null
          parameter_category?: string
          parameter_name?: string
          parameter_type?: string
          parameter_value?: string | null
          parent_parameter?: string | null
          store_id?: string
          template_id?: string
          updated_at?: string
          xml_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_template_parameters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "user_stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_template_parameters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          is_active: boolean
          name: string
          product_count: number
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_count?: number
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_count?: number
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
      template_categories: {
        Row: {
          category_name: string
          created_at: string
          external_id: string | null
          id: string
          rz_id: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          category_name: string
          created_at?: string
          external_id?: string | null
          id?: string
          rz_id?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          category_name?: string
          created_at?: string
          external_id?: string | null
          id?: string
          rz_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_categories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      template_currencies: {
        Row: {
          created_at: string
          currency_code: string
          id: string
          rate: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          id?: string
          rate?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          id?: string
          rate?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_currencies_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      template_images: {
        Row: {
          created_at: string
          id: string
          image_field_name: string
          is_multiple: boolean
          max_count: number | null
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_field_name?: string
          is_multiple?: boolean
          max_count?: number | null
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_field_name?: string
          is_multiple?: boolean
          max_count?: number | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_images_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      template_offer_parameters: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          parameter_name: string
          parameter_type: string | null
          parameter_values: Json
          template_id: string
          updated_at: string
          xml_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          parameter_name: string
          parameter_type?: string | null
          parameter_values?: Json
          template_id: string
          updated_at?: string
          xml_path: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          parameter_name?: string
          parameter_type?: string | null
          parameter_values?: Json
          template_id?: string
          updated_at?: string
          xml_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_offer_parameters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      template_xml: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          shop_company: string | null
          shop_name: string | null
          shop_url: string | null
          structure: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          shop_company?: string | null
          shop_name?: string | null
          shop_url?: string | null
          structure: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          shop_company?: string | null
          shop_name?: string | null
          shop_url?: string | null
          structure?: Json
          updated_at?: string
        }
        Relationships: []
      }
      template_xml_parameters: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean
          is_required: boolean
          nested_values: Json | null
          parameter_category: string
          parameter_name: string
          parameter_type: string
          parameter_value: string | null
          parent_parameter: string | null
          template_id: string
          updated_at: string
          xml_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          nested_values?: Json | null
          parameter_category?: string
          parameter_name: string
          parameter_type?: string
          parameter_value?: string | null
          parent_parameter?: string | null
          template_id: string
          updated_at?: string
          xml_path: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          nested_values?: Json | null
          parameter_category?: string
          parameter_name?: string
          parameter_type?: string
          parameter_value?: string | null
          parent_parameter?: string | null
          template_id?: string
          updated_at?: string
          xml_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_xml_parameters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      template_xml_structure: {
        Row: {
          attributes: Json | null
          created_at: string
          display_order: number | null
          element_name: string
          element_value: string | null
          id: string
          is_active: boolean | null
          parent_id: string | null
          structure_type: string
          template_id: string
          updated_at: string
          xml_path: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          display_order?: number | null
          element_name: string
          element_value?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          structure_type: string
          template_id: string
          updated_at?: string
          xml_path: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          display_order?: number | null
          element_name?: string
          element_value?: string | null
          id?: string
          is_active?: boolean | null
          parent_id?: string | null
          structure_type?: string
          template_id?: string
          updated_at?: string
          xml_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_xml_structure_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "template_xml_structure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_xml_structure_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stores: {
        Row: {
          created_at: string
          id: string
          name: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stores_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "template_xml"
            referencedColumns: ["id"]
          },
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
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          username: string
        }
        Update: {
          avatar_url?: string | null
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
      add_avatar_column_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
