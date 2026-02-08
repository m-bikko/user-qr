"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateRestaurantThemeAction } from "@/actions/update-restaurant-theme"
import { Loader2, Palette } from "lucide-react"
import { useTranslations } from "next-intl"

export function ThemeSwitcher({
    restaurantId,
    initialTheme
}: {
    restaurantId: string,
    initialTheme: string
}) {
    const t = useTranslations('Admin')
    const [theme, setTheme] = useState(initialTheme)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (theme === initialTheme) return

        setLoading(true)
        const result = await updateRestaurantThemeAction(restaurantId, theme)

        if (result.error) {
            alert(result.error) // Replace with toast if available
        } else {
            alert(result.message) // Replace with toast
        }
        setLoading(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {t('theme_branding')}
                </CardTitle>
                <CardDescription>
                    {t('theme_branding_description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{t('menu_layout')}</label>
                    <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">{t('theme_default')}</SelectItem>
                            <SelectItem value="modern">{t('theme_modern')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={loading || theme === initialTheme}
                    className="w-full"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('save_changes')}
                </Button>
            </CardContent>
        </Card>
    )
}
