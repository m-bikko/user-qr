'use server'

import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

export async function updateRestaurantSettingsAction(restaurantId: string, data: { telegram_chat_id?: string, primary_color?: string, background_color?: string }) {
    const supabase = await createClient()
    const t = await getTranslations('Admin')

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error("Unauthorized")

        const { data: profile } = await supabase
            .from('profiles')
            .select('restaurant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile) throw new Error("Profile not found")

        const isSuperAdmin = profile.role === 'super_admin'
        const isRestaurantAdmin = profile.role === 'restaurant_admin' && profile.restaurant_id === restaurantId

        if (!isSuperAdmin && !isRestaurantAdmin) {
            return { error: t('unauthorized_action') }
        }

        const { error } = await supabase
            .from('restaurants')
            .update(data)
            .eq('id', restaurantId)

        if (error) throw error

        revalidatePath('/[locale]/admin/settings', 'page')

        return { success: true, message: t('settings_updated_success') }

    } catch (e: any) {
        console.error("Error updating settings:", e)
        return { error: e.message || 'Error updating settings' }
    }
}
