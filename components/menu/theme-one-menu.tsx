"use client"

import { useEffect, useState } from "react"
import { Database } from "@/types/supabase"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Plus, Minus } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
// @ts-ignore
import { FeedbackButton } from "@/components/feedback-button"

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Kitchen = Database['public']['Tables']['kitchens']['Row']

// Helper for hex validation
function isValidHex(hex: string) {
    return /^#[0-9A-F]{6}$/i.test(hex)
}

// Helper for contrast
function getContrastColor(hex: string) {
    const r = parseInt(hex.substr(1, 2), 16)
    const g = parseInt(hex.substr(3, 2), 16)
    const b = parseInt(hex.substr(5, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return yiq >= 128 ? '#000000' : '#ffffff'
}

export function ThemeOneMenu({
    categories,
    kitchens,
    products,
    restaurantSlug,
    restaurantName,
    restaurantId,
    restaurantLogo,
    telegramChatId,
    primaryColor,
    backgroundColor,
    commissionPercentage
}: {
    categories: Category[],
    kitchens: Kitchen[],
    products: Product[],
    restaurantSlug: string,
    restaurantName: string,
    restaurantId: string,
    restaurantLogo: string | null,
    telegramChatId?: string | null,
    primaryColor: string,
    backgroundColor: string,
    commissionPercentage?: number
}) {

    const t = useTranslations('Index')
    const router = useRouter()
    const locale = useLocale()
    const { items, addItem, updateQuantity, removeItem, totalPrice, setCommission } = useCartStore()
    const [isMounted, setIsMounted] = useState(false)
    const [selectedKitchenId, setSelectedKitchenId] = useState<string | null>(null)

    useEffect(() => {
        if (commissionPercentage !== undefined) {
            setCommission(commissionPercentage)
        }
    }, [commissionPercentage, setCommission])

    // Calculate dynamic styles
    const safeColor = isValidHex(primaryColor) ? primaryColor : '#000000'
    const safeBackgroundColor = isValidHex(backgroundColor) ? backgroundColor : '#ffffff'
    const foregroundColor = getContrastColor(safeColor)
    // Calculate foreground for the background color to ensure text readability in cart if needed
    const backgroundForeground = getContrastColor(safeBackgroundColor)

    // CSS variables to inject
    const dynamicStyle = {
        // @ts-ignore
        "--primary": safeColor,
        "--primary-foreground": foregroundColor,
        "--ring": safeColor,
        "--background": safeBackgroundColor,
        "--foreground": backgroundForeground === '#ffffff' ? '#ffffff' : '#000000',
    } as React.CSSProperties

    useEffect(() => {
        setIsMounted(true)
        if (kitchens.length > 0) {
            setSelectedKitchenId(kitchens[0].id)
        }
    }, [kitchens])

    if (!isMounted) return null

    const getLocalized = (obj: any, field: string) => {
        return obj[`${field}_${locale}`] || obj[`${field}_en`] || ""
    }

    // Filter categories by selected kitchen
    const filteredCategories = selectedKitchenId
        ? categories.filter(c => c.kitchen_id === selectedKitchenId)
        : categories

    const groupedProducts = filteredCategories.map(category => ({
        ...category,
        items: products.filter(p => p.category_id === category.id)
    })).filter(g => g.items.length > 0)

    // Helper to get total quantity of a product in cart
    const getProductQuantity = (productId: string) => {
        return items.filter(i => i.productId === productId).reduce((acc, i) => acc + i.quantity, 0)
    }

    // Helper to handle add/increment
    const handleAdd = (e: React.MouseEvent, product: Product) => {
        e.preventDefault()
        e.stopPropagation()

        // Check if product has options
        const hasOptions = Array.isArray(product.options) && product.options.length > 0

        if (hasOptions) {
            // Redirect to details if options exist (must choose)
            router.push(`/${locale}/${restaurantSlug}/product/${product.id}`)
        } else {
            // No options, direct add
            addItem(product, 1, [])
        }
    }

    const handleRemove = (e: React.MouseEvent, product: Product) => {
        e.preventDefault()
        e.stopPropagation()

        const cartItem = items.findLast(i => i.productId === product.id)
        if (cartItem) {
            if (cartItem.quantity > 1) {
                updateQuantity(cartItem.id, cartItem.quantity - 1)
            } else {
                removeItem(cartItem.id)
            }
        }
    }

    // Custom smooth scroll function
    const scrollToCategory = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (!element) return;

        // Account for sticky headers (Header 53px + Kitchens ~48px + Categories ~50px)
        // Needs adjustment based on actual heights
        const headerOffset = 160;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        const startPosition = window.pageYOffset;
        const distance = offsetPosition - startPosition;
        const duration = 1000;
        let start: number | null = null;

        function animation(currentTime: number) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t: number, b: number, c: number, d: number) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    };

    return (
        <div className="relative min-h-screen pb-24 bg-background">
            {/* Commission Banner */}
            {commissionPercentage && commissionPercentage > 0 ? (
                <div
                    className="w-full py-2 text-center text-sm font-bold text-white shadow-sm z-50 relative"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t('commission_display', { percentage: commissionPercentage })}
                </div>
            ) : null}

            {/* Header / Lang Switcher */}
            <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-[53px]">
                <div className="flex items-center gap-3">
                    {restaurantLogo ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border">
                            <Image src={restaurantLogo} alt={restaurantName} fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border">
                            {restaurantName.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <h1 className="font-bold text-lg truncate max-w-[200px]">{restaurantName}</h1>
                </div>
                <LanguageSwitcher />
            </div>

            {/* Kitchen Tabs - Scrollable Cards */}
            {kitchens.length > 1 && (
                <div className="relative bg-background border-b overflow-x-auto whitespace-nowrap py-2 px-4 scrollbar-hide">
                    <div className="flex space-x-4">
                        {kitchens.map(kitchen => (
                            <button
                                key={kitchen.id}
                                onClick={() => setSelectedKitchenId(kitchen.id)}
                                className={cn(
                                    "group flex flex-col items-center gap-2 shrink-0 transition-opacity",
                                    selectedKitchenId === kitchen.id ? "opacity-100" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "relative w-28 aspect-[4/3] rounded-lg overflow-hidden border transition-all",
                                    selectedKitchenId === kitchen.id ? "ring-2 ring-primary ring-offset-2" : "border-transparent"
                                )}>
                                    {kitchen.image_url ? (
                                        <Image
                                            src={kitchen.image_url}
                                            alt={getLocalized(kitchen, 'name')}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs p-2 text-center whitespace-normal">
                                            {t('no_image')}
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    selectedKitchenId === kitchen.id ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {getLocalized(kitchen, 'name')}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Category Nav - Sticky under main header */}
            <div className={cn(
                "sticky top-[53px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b overflow-x-auto whitespace-nowrap py-3 px-4 scrollbar-hide"
            )}>
                <div className="flex space-x-2">
                    {groupedProducts.map(cat => (
                        <a
                            key={cat.id}
                            href={`#cat-${cat.id}`}
                            onClick={(e) => scrollToCategory(e, `cat-${cat.id}`)}
                            className="px-5 py-2 rounded-full bg-secondary/50 text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                        >
                            {getLocalized(cat, 'name')}
                        </a>
                    ))}
                    {groupedProducts.length === 0 && (
                        <span className="text-sm text-muted-foreground py-2">
                            {t('no_categories', { defaultMessage: "No categories in this kitchen" })}
                        </span>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-10 max-w-xl">
                {groupedProducts.map(category => (
                    <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-48 space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight">{getLocalized(category, 'name')}</h2>

                        <div className="space-y-4">
                            {category.items.map(product => {
                                const qty = getProductQuantity(product.id)
                                const productName = getLocalized(product, 'name')
                                const productDesc = getLocalized(product, 'description')
                                return (
                                    <div key={product.id} className="relative group">
                                        <Link href={`/${locale}/${restaurantSlug}/product/${product.id}`} className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all">
                                            {/* Image */}
                                            <div className="relative aspect-square w-28 h-28 rounded-lg bg-muted overflow-hidden shrink-0">
                                                {product.image_url ? (
                                                    <Image
                                                        src={product.image_url}
                                                        alt={productName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">{t('no_image')}</div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg line-clamp-1">{productName}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{productDesc}</p>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="font-medium text-lg">
                                                        {product.price} ₸
                                                    </div>

                                                    {qty > 0 ? (
                                                        <div className="flex items-center bg-secondary rounded-lg h-9 shadow-sm" onClick={(e) => e.preventDefault()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-foreground hover:text-primary rounded-l-lg"
                                                                onClick={(e) => handleRemove(e, product)}
                                                            >
                                                                <Minus className="w-4 h-4" />
                                                            </Button>
                                                            <span className="w-8 text-center font-medium text-sm">{qty}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 text-foreground hover:text-primary rounded-r-lg"
                                                                onClick={(e) => handleAdd(e, product)}
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="icon"
                                                            variant="secondary"
                                                            className="h-9 w-9 rounded-full shadow-sm"
                                                            onClick={(e) => handleAdd(e, product)}
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
                {groupedProducts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        {t('no_products', { defaultMessage: "No products available." })}
                    </div>
                )}
            </div>

            {/* Sticky Cart Button */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="pointer-events-auto w-full max-w-md h-14 shadow-2xl text-lg flex justify-between items-center px-6 rounded-full transition-all transform hover:scale-[1.02] bg-primary text-primary-foreground hover:bg-primary/90">
                                <div className="flex items-center gap-3">
                                    <div className="bg-background text-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                                        {items.reduce((acc, i) => acc + i.quantity, 0)}
                                    </div>
                                    <span>{t('view_cart')}</span>
                                </div>
                                <span className="font-mono">{totalPrice()} ₸</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] flex flex-col sm:max-w-md sm:mx-auto rounded-t-2xl">
                            {/* Inject styles here for the portal content */}
                            <div className="contents" style={dynamicStyle}>
                                <SheetHeader className="mb-4 px-6">
                                    <SheetTitle>{t('your_order')}</SheetTitle>
                                </SheetHeader>

                                {/* Plain Text Cart View */}
                                <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0 px-6">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{getLocalized(item.product, 'name')}</div>
                                                {(item.selectedOptions || []).length > 0 && (
                                                    <div className="mt-2 space-y-2">
                                                        {Object.entries(
                                                            item.selectedOptions.reduce((acc, option) => {
                                                                const parts = option.name.split(': ')
                                                                const group = parts.length > 1 ? parts[0] : 'Other'
                                                                const name = parts.length > 1 ? parts[1] : parts[0]

                                                                if (!acc[group]) acc[group] = []
                                                                acc[group].push({ ...option, displayName: name })
                                                                return acc
                                                            }, {} as Record<string, any[]>)
                                                        ).map(([group, options]) => (
                                                            <div key={group} className="text-xs">
                                                                {group !== 'Other' && (
                                                                    <div className="font-semibold text-muted-foreground mb-1">{group}</div>
                                                                )}
                                                                <div className="space-y-1 pl-2 border-l-2 border-muted">
                                                                    {options.map((o, i) => (
                                                                        <div key={i} className="text-muted-foreground flex justify-between items-start">
                                                                            <span className="mr-2">{o.displayName}</span>
                                                                            {o.price > 0 && <span className="font-medium">+{o.price} ₸</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 bg-secondary/50 rounded-lg px-2 py-1 shrink-0">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-lg leading-none active:scale-95 transition-transform"
                                                    onClick={() => {
                                                        if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1)
                                                        else removeItem(item.id)
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-medium tabular-nums">{item.quantity}</span>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-lg leading-none active:scale-95 transition-transform"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-right font-medium w-20 shrink-0">
                                                {(item.product.price + (item.selectedOptions?.reduce((a, b) => a + b.price, 0) || 0)) * item.quantity} ₸
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 pb-12 px-6 space-y-4">
                                    {commissionPercentage && commissionPercentage > 0 && (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>{t('total')} (Subtotal)</span>
                                                <span>
                                                    {items.reduce((total, item) => {
                                                        const optionsPrice = item.selectedOptions.reduce((acc, opt) => acc + opt.price, 0)
                                                        return total + ((item.product.price + optionsPrice) * item.quantity)
                                                    }, 0)} ₸
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-primary font-medium">
                                                <span>{t('commission_display', { percentage: commissionPercentage })}</span>
                                                <span>
                                                    {Math.round(items.reduce((total, item) => {
                                                        const optionsPrice = item.selectedOptions.reduce((acc, opt) => acc + opt.price, 0)
                                                        return total + ((item.product.price + optionsPrice) * item.quantity)
                                                    }, 0) * (commissionPercentage / 100))} ₸
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold">
                                        <span>{t('total')}</span>
                                        <span>{totalPrice()} ₸</span>
                                    </div>
                                    <Button className="w-full h-14 text-lg rounded-xl shadow-md">{t('checkout')}</Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            )}

            <FeedbackButton restaurantId={restaurantId} telegramChatId={telegramChatId || null} />
        </div>
    )
}
