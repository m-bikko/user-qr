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
                    sort_order: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name_en: string
                    name_kz: string
                    name_ru: string
                    sort_order?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    name_en?: string
                    name_kz?: string
                    name_ru?: string
                    sort_order?: number
                }
                Relationships: []
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
                }
                Relationships: [
                    {
                        foreignKeyName: "products_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
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
