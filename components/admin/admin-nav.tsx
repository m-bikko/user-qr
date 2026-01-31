"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Assuming Button is available
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { useTranslations } from "next-intl"


export function AdminNav() {
    const pathname = usePathname()
    const router = useRouter()
    const t = useTranslations('Admin')

    const items = [
        {
            title: t('dashboard'),
            href: "/admin",
        },
        {
            title: t('categories'),
            href: "/admin/categories",
        },
        {
            title: t('products'),
            href: "/admin/products",
        },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/admin/login")
    }

    return (
        <nav className="flex flex-col gap-2">
            <div className="px-2 mb-2 flex justify-between items-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
            </div>

            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "group flex w-full items-center rounded-md border border-transparent px-2 py-1 text-sm font-medium hover:bg-muted hover:text-foreground",
                        (() => {
                            const pathWithoutLocale = pathname.replace(/^\/(en|ru|kz)/, "") || "/"
                            if (item.href === "/admin") {
                                return pathWithoutLocale === "/admin"
                            }
                            return pathWithoutLocale.startsWith(item.href)
                        })()
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground"
                    )}
                >
                    {item.title}
                </Link>
            ))}
            <div className="pt-4 mt-4 border-t px-2">
                <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive px-0 hover:px-2" onClick={handleLogout}>
                    {t('logout')}
                </Button>
            </div>
        </nav>
    )
}
