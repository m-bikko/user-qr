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
                    kitchen_id: string | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id: string | null
                    sort_order: number
                    is_available: boolean | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    kitchen_id?: string | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id?: string | null
                    sort_order?: number
                    is_available?: boolean | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    kitchen_id?: string | null
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    restaurant_id?: string | null
                    sort_order?: number
                    is_available?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_kitchen_id_fkey"
                        columns: ["kitchen_id"]
                        referencedRelation: "kitchens"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "categories_restaurant_id_fkey"
                        columns: ["restaurant_id"]
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
                    restaurant_id: string | null
                    sort_order: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    image_url?: string | null
                    is_available?: boolean | null
                    name_en: string
                    name_kz: string
                    name_ru: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    image_url?: string | null
                    is_available?: boolean | null
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    restaurant_id?: string | null
                    sort_order?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "kitchens_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        referencedRelation: "restaurants"
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
                    sort_order?: number
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
                    sort_order?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "products_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    created_at: string
                    id: string
                    restaurant_id: string | null
                    role: string
                }
                Insert: {
                    created_at?: string
                    id: string
                    restaurant_id?: string | null
                    role?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    restaurant_id?: string | null
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_restaurant_id_fkey"
                        columns: ["restaurant_id"]
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
                    theme: string | null
                    telegram_chat_id: string | null
                    primary_color: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name: string
                    slug: string
                    theme?: string | null
                    telegram_chat_id?: string | null
                    primary_color?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    theme?: string | null
                    telegram_chat_id?: string | null
                    primary_color?: string | null
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
