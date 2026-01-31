import { supabase } from "@/lib/supabase"
import { ProductDetailClient } from "@/components/menu/product-detail-client"
import { notFound } from "next/navigation"

export default async function ProductDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    // Fetch product
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !product) {
        notFound()
    }

    // Fetch recommendations
    const { data: recData } = await supabase
        .from('product_recommendations')
        .select(`
      recommended_product:products (*)
    `)
        .eq('product_id', id)

    // Transform data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recommendations = (recData?.map((r: any) => r.recommended_product).filter(Boolean) || []) as any[]

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <ProductDetailClient
                product={product}
                recommendations={recommendations}
            />
        </div>
    )
}
