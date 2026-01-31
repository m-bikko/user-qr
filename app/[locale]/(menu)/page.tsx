import { supabase } from "@/lib/supabase"
import { MenuClient } from "@/components/menu/menu-client"

export default async function MenuPage() {
    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <MenuClient
                categories={categories || []}
                products={products || []}
            />
        </div>
    )
}
