import { supabase } from "@/lib/supabase"
import { MenuClient } from "@/components/menu/menu-client"
import { notFound } from "next/navigation"

export default async function MenuPage({
    params
}: {
    params: Promise<{ restaurantSlug: string }>
}) {
    const { restaurantSlug } = await params

    // Fetch restaurant
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, name, logo_url, theme, telegram_chat_id, primary_color')
        .eq('slug', restaurantSlug)
        .single()

    if (!restaurant) {
        notFound()
    }

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true })

    const { data: kitchens } = await supabase
        .from('kitchens')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true })

    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: true })

    return (
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen">
            <MenuClient
                categories={categories || []}
                kitchens={kitchens || []}
                products={products || []}
                restaurantSlug={restaurantSlug}
                restaurantName={restaurant.name}
                restaurantLogo={restaurant.logo_url}
                theme={restaurant.theme || 'default'}
                telegramChatId={restaurant.telegram_chat_id}
                primaryColor={restaurant.primary_color || '#000000'}
            />
        </div>
    )
}
