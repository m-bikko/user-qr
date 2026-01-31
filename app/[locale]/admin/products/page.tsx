import { supabase } from "@/lib/supabase"
import { ProductClient } from "@/components/admin/product-client"

export default async function ProductsPage() {
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

    if (prodError || catError) {
        return <div>Error loading data</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            </div>
            <ProductClient initialProducts={products || []} categories={categories || []} />
        </div>
    )
}
