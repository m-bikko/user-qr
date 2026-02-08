
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
        .select('primary_color')
        .eq('slug', restaurantSlug)
        .single()

    // Default or fetched color
    const primaryColor = restaurant?.primary_color || '#000000'

    // Ensure it's a valid hex before processing, fallback to black if not
    const safeColor = isValidHex(primaryColor) ? primaryColor : '#000000'
    const foregroundColor = getContrastColor(safeColor)

    // We can inject styles via a style tag or inline styles on a wrapper. 
    // A style tag is cleaner for overriding globally within this subtree.
    // However, React style tags need to be handled carefully or just use a wrapper div with CSS vars.
    // Using a wrapper div is React-idiomatic.

    return (
        <div
            style={{
                // @ts-ignore
                "--primary": safeColor,
                "--primary-foreground": foregroundColor,
                // We might need to override ring/border too if requested, but let's start with primary
                "--ring": safeColor,
            } as React.CSSProperties}
            className="contents" // "contents" makes the div phantom in the DOM tree layout-wise
        >
            {children}
        </div>
    )
}
