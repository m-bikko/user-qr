import { createClient } from "@/lib/supabase-server"
import { ProductClient } from "@/components/admin/product-client"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function ProductsPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${locale}/login`)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const cookieStore = await cookies()
    const contextRestaurantId = cookieStore.get('admin_context_restaurant_id')?.value

    let restaurantId: string | null = null

    if (profile?.role === 'super_admin') {
        if (contextRestaurantId) {
            restaurantId = contextRestaurantId
        }
    } else if (profile?.restaurant_id) {
        restaurantId = profile.restaurant_id
    }

    if (!restaurantId) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                </div>
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                    Please select a restaurant from the menu to manage products.
                </div>
            </div>
        )
    }

    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })

    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })

    const { data: kitchens, error: kitchenError } = await supabase
        .from('kitchens')
        .select('*')
        .eq('restaurant_id', restaurantId)

    if (prodError || catError || kitchenError) {
        return <div>Error loading data</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            </div>
            <ProductClient
                initialProducts={products || []}
                categories={categories || []}
                kitchens={kitchens || []}
                restaurantId={restaurantId}
            />
        </div>
    )
}
