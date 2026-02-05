
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
            categories: {
                Row: {
                    created_at: string
                    id: string
                    is_available: boolean | null
                    kitchen_id: string | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id: string | null
                    sort_order: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_available?: boolean | null
                    kitchen_id?: string | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_available?: boolean | null
                    kitchen_id?: string | null
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_kitchen_id_fkey"
                        columns: ["kitchen_id"]
                        isOneToOne: false
                        referencedRelation: "kitchens"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "categories_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    }
                ]
            }
            kitchens: {
                Row: {
                    created_at: string
                    id: string
                    image_url: string | null
                    is_available: boolean | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id: string
                    slug: string | null
                    sort_order: number | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_available?: boolean | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id: string
                    slug?: string | null
                    sort_order?: number | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_available?: boolean | null
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    restaurant_id?: string
                    slug?: string | null
                    sort_order?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "kitchens_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    }
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
                    }
                ]
            }
            products: {
                Row: {
                    category_id: string | null
                    created_at: string
                    description_en: string | null
                    description_kz: string | null
                    description_ru: string | null
                    id: string
                    image_url: string | null
                    is_available: boolean | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    options: Json | null
                    price: number
                    restaurant_id: string | null
                    sort_order: number
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string
                    description_en?: string | null
                    description_kz?: string | null
                    description_ru?: string | null
                    id?: string
                    image_url?: string | null
                    is_available?: boolean | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    options?: Json | null
                    price?: number
                    restaurant_id?: string | null
                }
                Update: {
                    category_id?: string | null
                    created_at?: string
                    description_en?: string | null
                    description_kz?: string | null
                    description_ru?: string | null
                    id?: string
                    image_url?: string | null
                    is_available?: boolean | null
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
                    }
                ]
            }
            profiles: {
                Row: {
                    created_at: string
                    email: string | null
                    id: string
                    restaurant_id: string | null
                    role: string
                }
                Insert: {
                    created_at?: string
                    email?: string | null
                    id: string
                    restaurant_id?: string | null
                    role?: string
                }
                Update: {
                    created_at?: string
                    email?: string | null
                    id?: string
                    restaurant_id?: string | null
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    }
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
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}