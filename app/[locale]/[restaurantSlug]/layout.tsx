
import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"

// Validation helper
function isValidHex(hex: string) {
    return /^#[0-9A-F]{6}$/i.test(hex)
}

// Contrast helper (Simple YIQ)
function getContrastColor(hex: string) {
    const r = parseInt(hex.substr(1, 2), 16)
    const g = parseInt(hex.substr(3, 2), 16)
    const b = parseInt(hex.substr(5, 2), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return yiq >= 128 ? '#000000' : '#ffffff'
}

export default async function RestaurantLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ restaurantSlug: string }>
}) {
    const { restaurantSlug } = await params

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('primary_color, background_color')
        .eq('slug', restaurantSlug)
        .single()

    // Default or fetched color
    const primaryColor = restaurant?.primary_color || '#000000'
    const backgroundColor = restaurant?.background_color || '#ffffff'

    // Ensure it's a valid hex before processing, fallback to black/white if not
    const safeColor = isValidHex(primaryColor) ? primaryColor : '#000000'
    const safeBackgroundColor = isValidHex(backgroundColor) ? backgroundColor : '#ffffff'
    const foregroundColor = getContrastColor(safeColor)

    return (
        <div
            style={{
                // @ts-ignore
                "--primary": safeColor,
                "--primary-foreground": foregroundColor,
                "--ring": safeColor,
                // Override background if custom color is set
                "--background": safeBackgroundColor,
                // Ensure text is readable on custom background (simple check)
                "--foreground": getContrastColor(safeBackgroundColor) === '#ffffff' ? '#ffffff' : '#000000',
            } as React.CSSProperties}
            className="contents"
        >
            <div className={`min-h-screen bg-[var(--background)] text-[var(--foreground)]`}>
                {children}
            </div>
        </div>
    )
}
