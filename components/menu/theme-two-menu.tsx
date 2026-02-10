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

export function ThemeTwoMenu({
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
        <div className="relative min-h-screen pb-24 bg-background/50">
            {/* Commission Banner */}
            {commissionPercentage && commissionPercentage > 0 ? (
                <div
                    className="w-full py-2 text-center text-sm font-bold text-white shadow-sm z-50 relative"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t('commission_display', { percentage: commissionPercentage })}
                </div>
            ) : null}

            {/* Theme 2 Header - More compact maybe? stick to same for consistency */}
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

            {/* Kitchen Tabs - Less prominent in Theme 2? User didn't specify, keeping functional logic */}
            {kitchens.length > 1 && (
                <div className="relative bg-background border-b overflow-x-auto whitespace-nowrap py-4 px-4 scrollbar-hide">
                    <div className="flex space-x-4">
                        {kitchens.map(kitchen => (
                            <button
                                key={kitchen.id}
                                onClick={() => setSelectedKitchenId(kitchen.id)}
                                className={cn(
                                    "group flex flex-col items-center gap-2 shrink-0 transition-all",
                                    selectedKitchenId === kitchen.id ? "opacity-100 scale-105" : "opacity-70 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "relative w-28 aspect-[4/3] rounded-lg overflow-hidden shadow-sm transition-all",
                                    selectedKitchenId === kitchen.id ? "ring-2 ring-primary ring-offset-1" : "border border-transparent"
                                )}>
                                    {kitchen.image_url ? (
                                        <Image
                                            src={kitchen.image_url}
                                            alt=""
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs p-1">
                                            {t('no_image')}
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium leading-none",
                                    selectedKitchenId === kitchen.id ? "text-primary font-bold" : "text-muted-foreground"
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
                "sticky top-[53px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b overflow-x-auto whitespace-nowrap py-2 px-4 scrollbar-hide"
            )}>
                <div className="flex space-x-2">
                    {groupedProducts.map(cat => (
                        <a
                            key={cat.id}
                            href={`#cat-${cat.id}`}
                            onClick={(e) => scrollToCategory(e, `cat-${cat.id}`)}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                        >
                            {getLocalized(cat, 'name')}
                        </a>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 space-y-8 max-w-xl">
                {groupedProducts.map(category => (
                    <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-40 space-y-3">
                        <h2 className="text-xl font-bold tracking-tight px-1">{getLocalized(category, 'name')}</h2>

                        {/* Theme 2: Grid Layout - 2 items per row */}
                        <div className="grid grid-cols-2 gap-3">
                            {category.items.map(product => {
                                const qty = getProductQuantity(product.id)
                                const productName = getLocalized(product, 'name')
                                const productDesc = getLocalized(product, 'description')

                                return (
                                    <Link
                                        href={`/${locale}/${restaurantSlug}/product/${product.id}`}
                                        key={product.id}
                                        className="group relative flex flex-col bg-card rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition-all h-full"
                                    >
                                        {/* Image - Wider aspect ratio (Landscape) */}
                                        <div className="relative w-full aspect-[16/10] bg-muted overflow-hidden">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={productName}
                                                    fill
                                                    className="object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground text-[10px]">{t('no_image')}</div>
                                            )}

                                            {/* Quantity Badge on Image */}
                                            {qty > 0 && (
                                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                    {qty}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content - Compact */}
                                        <div className="p-3 flex flex-col flex-1">
                                            <div className="mb-2 flex-1">
                                                <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1">{productName}</h3>
                                                <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">{productDesc}</p>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                                <span className="font-bold text-sm">{product.price} ₸</span>

                                                {qty > 0 ? (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                                                        <Button
                                                            variant="secondary"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full shrink-0"
                                                            onClick={(e) => handleRemove(e, product)}
                                                        >
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="text-sm font-bold w-4 text-center tabular-nums">{qty}</span>
                                                        <Button
                                                            variant="default"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full shrink-0"
                                                            onClick={(e) => handleAdd(e, product)}
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="h-7 w-7 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
                                                        onClick={(e) => handleAdd(e, product)}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}

                {groupedProducts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground text-sm">
                        {t('no_products', { defaultMessage: "No products." })}
                    </div>
                )}
            </div>

            {/* Default Cart Sheet/Button Logic (Same as Theme 1) */}
            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 z-50 flex justify-center pointer-events-none">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button className="pointer-events-auto w-full max-w-sm h-14 shadow-xl text-lg flex justify-between items-center px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-[1.02]">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                                        {items.reduce((acc, i) => acc + i.quantity, 0)}
                                    </div>
                                    <span className="font-semibold">{t('view_cart')}</span>
                                </div>
                                <span className="font-bold font-mono">{totalPrice()} ₸</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[90vh] flex flex-col sm:max-w-md sm:mx-auto rounded-t-2xl">
                            {/* Inject styles here for the portal content */}
                            <div className="contents" style={dynamicStyle}>
                                <SheetHeader className="mb-4 px-6 pt-2">
                                    <SheetTitle className="text-xl">{t('your_order')}</SheetTitle>
                                </SheetHeader>

                                {/* Cart Items List */}
                                <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-6">
                                    {items.map(item => (
                                        <div key={item.id} className="flex flex-col gap-3 border-b pb-4 last:border-0 border-border/50">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="font-semibold text-base truncate">{getLocalized(item.product, 'name')}</div>

                                                    {/* Options Display */}
                                                    {(item.selectedOptions || []).length > 0 && (
                                                        <div className="mt-2 text-sm space-y-1">
                                                            {item.selectedOptions.map((opt, i) => {
                                                                const parts = opt.name.split(': ')
                                                                const name = parts.length > 1 ? parts[1] : parts[0]
                                                                return (
                                                                    <div key={i} className="flex justify-between text-muted-foreground">
                                                                        <span>• {name}</span>
                                                                        {opt.price > 0 && <span className="text-xs font-medium">+{opt.price} ₸</span>}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right font-bold w-24 shrink-0">
                                                    {(item.product.price + (item.selectedOptions?.reduce((a, b) => a + b.price, 0) || 0)) * item.quantity} ₸
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">
                                                    {item.product.price + (item.selectedOptions?.reduce((a, b) => a + b.price, 0) || 0)} ₸ x {item.quantity}
                                                </div>
                                                <div className="flex items-center gap-3 bg-secondary/50 rounded-full px-1 py-1 shadow-sm border border-border/50">
                                                    <button
                                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                                        onClick={() => {
                                                            if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1)
                                                            else removeItem(item.id)
                                                        }}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-6 text-center font-bold text-sm tabular-nums">{item.quantity}</span>
                                                    <button
                                                        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 pb-8 px-6 space-y-4 bg-background">
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
                                    <Button className="w-full h-14 text-lg rounded-xl shadow-lg font-bold">{t('checkout')}</Button>
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
