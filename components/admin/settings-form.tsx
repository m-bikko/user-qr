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
    initialTheme
}: {
    restaurantId: string,
    initialChatId: string,
    initialTheme: string
}) {
    const t = useTranslations('Admin')
    const [chatId, setChatId] = useState(initialChatId)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const result = await updateRestaurantSettingsAction(restaurantId, { telegram_chat_id: chatId })

        if (result.error) {
            alert(result.error)
        } else {
            alert(result.message)
        }
        setLoading(false)
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

            {/* Theme Settings - Reusing functionality via ThemeSwitcher or new logic */}
            <ThemeSwitcher restaurantId={restaurantId} initialTheme={initialTheme} />
        </div>
    )
}
