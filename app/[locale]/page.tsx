
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu } from "lucide-react"

export default async function LandingPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: 'Index' })

    const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        {t('welcome_title', { defaultMessage: 'Welcome' })}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        {t('select_restaurant', { defaultMessage: 'Please select a restaurant to view the menu' })}
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(restaurants || []).map((restaurant) => (
                        <Link
                            key={restaurant.id}
                            href={`/${locale}/${restaurant.slug}`}
                            className="group block"
                        >
                            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Menu className="w-6 h-6" />
                                    </div>
                                    <CardTitle>{restaurant.name}</CardTitle>
                                    <CardDescription>@{restaurant.slug}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}

                    {(restaurants || []).length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No restaurants found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
