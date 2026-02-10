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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeSwitcher } from "@/components/admin/theme-switcher" // Reuse existing if possible or adapt
import { updateRestaurantSettingsAction } from "@/actions/update-restaurant-settings"
import { Loader2, Save } from "lucide-react"
import { useTranslations } from "next-intl"

export function AdminSettingsForm({
    restaurantId,
    initialChatId,
    initialTheme,
    initialColor,
    initialBackgroundColor,
    initialCommission
}: {
    restaurantId: string,
    initialChatId: string,
    initialTheme: string,
    initialColor?: string,
    initialBackgroundColor?: string,
    initialCommission: number
}) {
    const t = useTranslations('Admin')
    const [chatId, setChatId] = useState(initialChatId)
    const [primaryColor, setPrimaryColor] = useState(initialColor || '#000000')
    const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor || '#ffffff')
    const [commission, setCommission] = useState(initialCommission || 0)
    const [loading, setLoading] = useState(false)
    const [loadingColor, setLoadingColor] = useState(false)
    const [loadingCommission, setLoadingCommission] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const result = await updateRestaurantSettingsAction(restaurantId, { telegram_chat_id: chatId })
        if (result.error) alert(result.error)
        else alert(result.message)
        setLoading(false)
    }

    const handleSaveColor = async () => {
        setLoadingColor(true)
        const result = await updateRestaurantSettingsAction(restaurantId, {
            primary_color: primaryColor,
            background_color: backgroundColor
        })
        if (result.error) alert(result.error)
        else alert(result.message)
        if (result.error) alert(result.error)
        else alert(result.message)
        setLoadingColor(false)
    }

    const handleSaveCommission = async () => {
        setLoadingCommission(true)
        const result = await updateRestaurantSettingsAction(restaurantId, {
            commission_percentage: commission
        })
        if (result.error) alert(result.error)
        else alert(result.message)
        setLoadingCommission(false)
    }

    return (
        <div className="space-y-6">
            {/* Telegram Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('telegram_config_title')}</CardTitle>
                    <CardDescription>
                        {t('telegram_config_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chatId">{t('telegram_chat_id')}</Label>
                        <Input
                            id="chatId"
                            placeholder="-100xxxxxxxx"
                            value={chatId}
                            onChange={(e) => setChatId(e.target.value)}
                        />
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>
                                {t.rich('telegram_instruction_1', {
                                    link: (chunks) => <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@userinfobot</a>
                                })}
                            </p>
                            <p>{t('telegram_instruction_2')}</p>
                            <p>{t('telegram_instruction_3')}</p>
                            <p className="font-bold text-primary mt-2">
                                {t.rich('telegram_instruction_4', {
                                    link: (chunks) => <a href="https://t.me/userQRFeedbackBot" target="_blank" rel="noopener noreferrer" className="underline">@userQRFeedbackBot</a>
                                })}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save_changes')}
                    </Button>
                </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('appearance_config_title')}</CardTitle>
                    <CardDescription>{t('appearance_config_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor">{t('primary_color')}</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="primaryColor"
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-12 h-12 p-1 cursor-pointer"
                            />
                            <Input
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-32"
                                placeholder="#000000"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="backgroundColor">{t('background_color')}</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                id="backgroundColor"
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-12 h-12 p-1 cursor-pointer"
                            />
                            <Input
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-32"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveColor} disabled={loadingColor}>
                        {loadingColor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save_details')}
                    </Button>
                </CardContent>
            </Card>

            {/* Order Settings (Commission) */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('order_config_title')}</CardTitle>
                    <CardDescription>{t('order_config_desc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="commission">{t('commission_percentage')}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="commission"
                                type="number"
                                min="0"
                                max="100"
                                value={commission}
                                onChange={(e) => setCommission(Number(e.target.value))}
                                className="w-24"
                            />
                            <span>%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('commission_help')}</p>
                    </div>
                    <Button onClick={handleSaveCommission} disabled={loadingCommission}>
                        {loadingCommission && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('save_details')}
                    </Button>
                </CardContent>
            </Card>

            {/* Theme Settings - Reusing functionality via ThemeSwitcher or new logic */}
            <ThemeSwitcher restaurantId={restaurantId} initialTheme={initialTheme} />
        </div >
    )
}
