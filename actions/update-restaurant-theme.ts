'use server'

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

export async function updateRestaurantThemeAction(restaurantId: string, theme: string) {
    const supabase = await createClient()
    const t = await getTranslations('Admin')

    try {
        // Verify user has access to this restaurant
        // 1. Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error("Unauthorized")

        // 2. Check profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('restaurant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error("Profile not found")

        // Allow if Super Admin OR if Restaurant Admin for this restaurant
        const isSuperAdmin = profile.role === 'super_admin'
        const isRestaurantAdmin = profile.role === 'restaurant_admin' && profile.restaurant_id === restaurantId

        if (!isSuperAdmin && !isRestaurantAdmin) {
            return { error: t('unauthorized_action') }
        }

        // 3. Update restaurant
        const { error } = await supabase
            .from('restaurants')
            .update({ theme })
            .eq('id', restaurantId)

        if (error) throw error

        revalidatePath('/[locale]/admin', 'page')
        revalidatePath('/[locale]/[restaurantSlug]', 'layout') // Revalidate public menu

        return { success: true, message: t('theme_updated_success') }

    } catch (e: any) {
        console.error("Error updating theme:", e)
        return { error: e.message || 'Error updating theme' }
    }
}
