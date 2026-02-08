// app/[locale]/admin/settings/page.tsx
import { createClient } from "@/lib/supabase-server"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import { AdminSettingsForm } from "@/components/admin/settings-form" // Client component
import { cookies } from "next/headers"

type Props = {
    params: Promise<{ locale: string }>
}

export default async function SettingsPage(props: Props) {
    const params = await props.params;
    const { locale } = params;

    const supabase = await createClient()
    const t = await getTranslations('Admin')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/${locale}/login`)

    // Get the restaurant context (similar to dashboard)
    const cookieStore = await cookies()
    const contextRestaurantId = cookieStore.get('admin_context_restaurant_id')?.value

    let restaurantId = contextRestaurantId
    if (!restaurantId) {
        const { data: profile } = await supabase.from('profiles').select('restaurant_id').single()
        restaurantId = profile?.restaurant_id || undefined
    }

    if (!restaurantId) return <div>Restaurant not found</div>

    // Fetch restaurant settings
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

    if (!restaurant) return <div>Restaurant not found</div>

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{t('settings')}</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <AdminSettingsForm
                    restaurantId={restaurant.id}
                    initialChatId={restaurant.telegram_chat_id || ''}
                    initialTheme={restaurant.theme || 'default'}
                    initialColor={restaurant.primary_color || '#000000'}
                />
            </div>
        </div>
    )
}
