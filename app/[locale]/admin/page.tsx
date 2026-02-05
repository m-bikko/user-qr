import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase-server';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Utensils, List, Package, ExternalLink } from 'lucide-react';
import { cookies } from 'next/headers';
import { QrCodeCard } from '@/components/admin/qr-code-card';

async function getStats() {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const contextRestaurantId = cookieStore.get('admin_context_restaurant_id')?.value;

    let restaurantId = contextRestaurantId;

    if (!restaurantId) {
        // Fallback to profile's restaurant_id if no context is set
        const { data: profile } = await supabase.from('profiles').select('restaurant_id').single();
        restaurantId = profile?.restaurant_id || undefined;
    }

    if (!restaurantId) return null;

    // Fetch counts in parallel
    const [
        { count: productsCount },
        { count: categoriesCount },
        { count: kitchensCount },
        { data: restaurant }
    ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
        supabase.from('kitchens').select('*', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
        supabase.from('restaurants').select('*').eq('id', restaurantId).single()
    ]);

    return {
        productsCount: productsCount || 0,
        categoriesCount: categoriesCount || 0,
        kitchensCount: kitchensCount || 0,
        restaurant
    };
}

export default async function AdminDashboard({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations('Admin');
    const stats = await getStats();

    if (!stats || !stats.restaurant) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50">
                <Utensils className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">{t('select_restaurant_placeholder')}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    {t('manage_restaurants_description')}
                </p>
            </div>
        );
    }

    const { productsCount, categoriesCount, kitchensCount, restaurant } = stats;
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/${restaurant.slug}`;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard_title')}</h1>
                <Button asChild variant="outline">
                    <Link href={`/${locale}/${restaurant.slug}`} target="_blank">
                        {t('view_public_menu')}
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_products')}</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productsCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('products_description', { defaultMessage: 'Active items on menu' })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_categories')}</CardTitle>
                        <List className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{categoriesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('categories_description', { defaultMessage: 'Menu sections' })}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('total_kitchens')}</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kitchensCount}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('kitchens_description', { defaultMessage: 'Production areas' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>{t('quick_actions')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Link href={`/${locale}/admin/products`} className="flex flex-col items-center justify-center p-6 bg-muted/50 hover:bg-muted rounded-lg border transition-colors space-y-2">
                            <Package className="h-8 w-8 text-primary" />
                            <span className="font-medium">{t('manage_products')}</span>
                        </Link>
                        <Link href={`/${locale}/admin/categories`} className="flex flex-col items-center justify-center p-6 bg-muted/50 hover:bg-muted rounded-lg border transition-colors space-y-2">
                            <List className="h-8 w-8 text-primary" />
                            <span className="font-medium">{t('manage_categories')}</span>
                        </Link>
                        <Link href={`/${locale}/admin/kitchens`} className="flex flex-col items-center justify-center p-6 bg-muted/50 hover:bg-muted rounded-lg border transition-colors space-y-2">
                            <Utensils className="h-8 w-8 text-primary" />
                            <span className="font-medium">{t('manage_kitchens')}</span>
                        </Link>
                    </CardContent>
                </Card>

                <QrCodeCard
                    publicUrl={publicUrl}
                    restaurantName={restaurant.name}
                    logoUrl={restaurant.logo_url}
                    testLinkText={t('test_link')}
                    title={t('menu_qr_code')}
                />
            </div>
        </div>
    );
}
