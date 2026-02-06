import { AdminGuard } from "@/components/auth/admin-guard"
import { AdminNav } from "@/components/admin/admin-nav"
import { getTranslations } from "next-intl/server"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = await getTranslations('Admin')
    const cookieStore = await cookies()
    const contextRestaurantId = cookieStore.get('admin_context_restaurant_id')
    const supabase = await createClient()

    // Fetch user profile
    const { data: { user } } = await supabase.auth.getUser()
    let profile = null
    let restaurants: any[] = []

    if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        profile = profileData

        if (profileData?.role === 'super_admin') {
            const { data: restaurantsData } = await supabase.from('restaurants').select('id, name, slug, logo_url').order('name')
            if (restaurantsData) restaurants = restaurantsData
        } else if (profileData?.restaurant_id) {
            const { data: myRest } = await supabase.from('restaurants').select('id, name, slug, logo_url').eq('id', profileData.restaurant_id).single()
            if (myRest) restaurants = [myRest]
        }
    }

    return (
        <AdminGuard>
            <div className="flex min-h-screen flex-col space-y-6">
                <header className="sticky top-0 z-40 border-b bg-background">
                    <div className="container flex h-16 items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                                    <SheetTitle className="sr-only">Menu</SheetTitle>
                                    <div className="px-6 py-6">
                                        <AdminNav
                                            initialRestaurantId={contextRestaurantId?.value}
                                            profile={profile}
                                            initialRestaurants={restaurants}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <div className="font-bold pl-2">{t('admin_title')}</div>
                        </div>
                        <LanguageSwitcher />
                    </div>
                </header>
                <div className="container grid flex-1 gap-12 md:grid-cols-[240px_1fr]">
                    <aside className="hidden w-[240px] flex-col md:flex pl-6">
                        <AdminNav
                            initialRestaurantId={contextRestaurantId?.value}
                            profile={profile}
                            initialRestaurants={restaurants}
                        />
                    </aside>
                    <main className="flex w-full flex-1 flex-col overflow-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    )
}
