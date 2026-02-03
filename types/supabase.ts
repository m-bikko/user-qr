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
            categories: {
                Row: {
                    created_at: string
                    id: string
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id: string | null
                    sort_order: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            product_recommendations: {
                Row: {
                    product_id: string
                    recommended_product_id: string
                }
                Insert: {
                    product_id: string
                    recommended_product_id: string
                }
                Update: {
                    product_id?: string
                    recommended_product_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "product_recommendations_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "product_recommendations_recommended_product_id_fkey"
                        columns: ["recommended_product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    category_id: string
                    created_at: string
                    description_en: string | null
                    description_kz: string | null
                    description_ru: string | null
                    id: string
                    image_url: string | null
                    is_available: boolean
                    name_en: string
                    name_kz: string
                    name_ru: string
                    options: Json | null
                    price: number
                    restaurant_id: string | null
                }
                Insert: {
                    category_id: string
                    created_at?: string
                    description_en?: string | null
                    description_kz?: string | null
                    description_ru?: string | null
                    id?: string
                    image_url?: string | null
                    is_available?: boolean
                    name_en: string
                    name_kz: string
                    name_ru: string
                    options?: Json | null
                    price: number
                    restaurant_id?: string | null
                }
                Update: {
                    category_id?: string
                    created_at?: string
                    description_en?: string | null
                    description_kz?: string | null
                    description_ru?: string | null
                    id?: string
                    image_url?: string | null
                    is_available?: boolean
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    options?: Json | null
                    price?: number
                    restaurant_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "products_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string
                    email: string | null
                    id: string
                    restaurant_id: string | null
                    role: Database["public"]["Enums"]["app_role"]
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    id: string
                    restaurant_id?: string | null
                    role?: Database["public"]["Enums"]["app_role"]
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    id?: string
                    restaurant_id?: string | null
                    role?: Database["public"]["Enums"]["app_role"]
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            restaurants: {
                Row: {
                    created_at: string
                    id: string
                    logo_url: string | null
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_restaurant_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
            is_super_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            app_role: "super_admin" | "restaurant_admin"
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
