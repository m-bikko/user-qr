"use client"

import Link from "next/link"
import { usePathname, useRouter, useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Database } from "@/types/supabase"
import { ChevronsUpDown, Check, Building, LayoutDashboard, Users } from "lucide-react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { setAdminContext, clearAdminContext } from "@/actions/admin-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Restaurant = {
    id: string
    name: string
    slug: string
    logo_url: string | null
}

export function AdminNav({
    initialRestaurantId
}: {
    initialRestaurantId?: string
}) {
    const pathname = usePathname()
    const router = useRouter()
    const params = useParams()
    // Default to 'en' if locale is missing, though it usually shouldn't be in this route
    const locale = params.locale as string || 'en'
    const t = useTranslations('Admin')

    const [profile, setProfile] = useState<Database['public']['Tables']['profiles']['Row'] | null>(null)
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    // If we are super admin, we use the cookie value (initialRestaurantId).
    // If we are restaurant_admin, we will set this once we fetch profile.
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>(initialRestaurantId)
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(profileData)

                if (profileData?.role === 'super_admin') {
                    // Fetch all restaurants for switcher
                    const { data: restaurantsData } = await supabase.from('restaurants').select('id, name, slug, logo_url').order('name')
                    if (restaurantsData) setRestaurants(restaurantsData)
                } else if (profileData?.restaurant_id) {
                    // Restaurant Admin: Context is fixed
                    setSelectedRestaurantId(profileData.restaurant_id)
                    // Fetch my restaurant details for logo
                    const { data: myRest } = await supabase.from('restaurants').select('id, name, slug, logo_url').eq('id', profileData.restaurant_id).single()
                    if (myRest) setRestaurants([myRest])
                }
            }
            setLoading(false)
        }
        init()
    }, [])

    const handleRestaurantSelect = async (restaurantId: string) => {
        setSelectedRestaurantId(restaurantId)
        setOpen(false)
        await setAdminContext(restaurantId)
        router.refresh()
    }

    const handleClearContext = async () => {
        setSelectedRestaurantId(undefined)
        setOpen(false)
        await clearAdminContext()
        router.refresh()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push(`/${locale}/admin/login`)
    }

    const activeRestaurant = restaurants.find(r => r.id === selectedRestaurantId)

    const items = [
        {
            title: t('dashboard'),
            href: `/${locale}/admin`,
            show: true
        },
        // Super Admin Management Links (Platform Overview)
        {
            title: t('restaurants'),
            href: `/${locale}/admin/restaurants`,
            show: profile?.role === 'super_admin' && !selectedRestaurantId
        },
        {
            title: "Users",
            href: `/${locale}/admin/users`,
            show: profile?.role === 'super_admin' && !selectedRestaurantId
        },
        // Context-dependent items (Restaurant Edit Mode)
        {
            title: t('categories'),
            href: `/${locale}/admin/categories`,
            show: !!selectedRestaurantId
        },
        {
            title: t('products'),
            href: `/${locale}/admin/products`,
            show: !!selectedRestaurantId
        },
    ]

    if (loading) return null

    return (
        <nav className="flex flex-col gap-2">
            <div className="px-2 mb-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('menu_title', { defaultMessage: 'Menu' })}</span>
                    {profile?.role === 'super_admin' && <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">SUPER</span>}
                </div>

                {/* Restaurant Context Switcher / Display */}
                {profile?.role === 'super_admin' ? (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between h-12 px-2"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {selectedRestaurantId ? (
                                        <>
                                            <Avatar className="h-6 w-6 rounded-sm">
                                                <AvatarImage src={activeRestaurant?.logo_url || undefined} className="object-cover" />
                                                <AvatarFallback className="rounded-sm">{activeRestaurant?.name?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="truncate text-sm">{activeRestaurant?.name}</span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">Select Restaurant...</span>
                                    )}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search restaurant..." />
                                <CommandList>
                                    <CommandEmpty>No restaurant found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all-clear"
                                            onSelect={handleClearContext}
                                            className="font-medium text-muted-foreground"
                                        >
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Platform Overview
                                            <Check
                                                className={cn(
                                                    "ml-auto h-4 w-4",
                                                    !selectedRestaurantId ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                        {restaurants.map((restaurant) => (
                                            <CommandItem
                                                key={restaurant.id}
                                                value={restaurant.name}
                                                onSelect={() => handleRestaurantSelect(restaurant.id)}
                                            >
                                                <span className="truncate">{restaurant.name}</span>
                                                <Check
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        selectedRestaurantId === restaurant.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                ) : (
                    // Restaurant Admin View
                    <div className="flex items-center gap-2 px-2 py-2 bg-muted/50 rounded-md border text-sm">
                        <Avatar className="h-8 w-8 rounded-sm">
                            <AvatarImage src={restaurants[0]?.logo_url || undefined} className="object-cover" />
                            <AvatarFallback className="rounded-sm"><Building className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                            <span className="truncate font-medium">{restaurants[0]?.name || "Loading..."}</span>
                            <span className="text-[10px] text-muted-foreground">Standard Plan</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                {items.filter(i => i.show).map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex w-full items-center rounded-md border border-transparent px-2 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground transition-colors",
                            pathname === item.href ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
                        )}
                    >
                        {item.title}
                    </Link>
                ))}
            </div>

            <div className="pt-4 mt-auto border-t px-2">
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive px-0 hover:px-2 gap-2" onClick={handleLogout}>
                    {/* Icon for logout could be added here */}
                    {t('logout')}
                </Button>
            </div>
        </nav>
    )
}
