"use client"

import { Database } from "@/types/supabase"
import { ThemeOneMenu } from "./theme-one-menu"
import { ThemeTwoMenu } from "./theme-two-menu"

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Kitchen = Database['public']['Tables']['kitchens']['Row']

export function MenuClient({
    categories,
    kitchens,
    products,
    restaurantSlug,
    restaurantName,
    restaurantLogo,
    theme = 'default',
    telegramChatId,
    primaryColor
}: {
    categories: Category[],
    kitchens: Kitchen[],
    products: Product[],
    restaurantSlug: string,
    restaurantName: string,
    restaurantLogo: string | null,
    theme?: string,
    telegramChatId?: string | null,
    primaryColor: string
}) {
    if (theme === 'modern') {
        return (
            <ThemeTwoMenu
                categories={categories}
                kitchens={kitchens}
                products={products}
                restaurantSlug={restaurantSlug}
                restaurantName={restaurantName}
                restaurantLogo={restaurantLogo}
                telegramChatId={telegramChatId}
                primaryColor={primaryColor}
            />
        )
    }

    // Default Theme (Theme 1)
    return (
        <ThemeOneMenu
            categories={categories}
            kitchens={kitchens}
            products={products}
            restaurantSlug={restaurantSlug}
            restaurantName={restaurantName}
            restaurantLogo={restaurantLogo}
            telegramChatId={telegramChatId}
            primaryColor={primaryColor}
        />
    )
}
