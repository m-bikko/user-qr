"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const switchLocale = (newLocale: string) => {
        // Replace the locale segment in the pathname
        // Pathname usually starts with /en, /ru, /kz
        const segments = pathname.split('/')
        if (segments.length > 1) {
            segments[1] = newLocale
        } else {
            segments.unshift(newLocale) // Fallback if root (though root redirects usually)
        }
        const newPath = segments.join('/')
        router.push(newPath)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => switchLocale("en")} className={locale === 'en' ? 'bg-secondary' : ''}>
                    🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale("ru")} className={locale === 'ru' ? 'bg-secondary' : ''}>
                    🇷🇺 Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLocale("kz")} className={locale === 'kz' ? 'bg-secondary' : ''}>
                    🇰🇿 Қазақша
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
