'use server'

import { createClient } from "@/lib/supabase-server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function sendFeedbackAction(formData: FormData) {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: "Bot not configured" }
    }

    const restaurantId = formData.get('restaurantId') as string
    const comment = formData.get('comment') as string

    // Extract photos
    const photos: File[] = []
    for (let i = 0; i < 3; i++) {
        const photo = formData.get(`photo_${i}`)
        if (photo instanceof File) {
            photos.push(photo)
        }
    }

    if (!restaurantId) return { success: false, error: "Missing restaurant ID" }

    const supabase = await createClient()

    try {
        // 1. Get Chat ID (and name)
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('telegram_chat_id, name')
            .eq('id', restaurantId)
            .single()

        // @ts-ignore
        if (!restaurant || !restaurant.telegram_chat_id) {
            return { success: false, error: "Restaurant not configured for feedback" }
        }

        const chatId = restaurant.telegram_chat_id
        const restaurantName = restaurant.name

        // Construct the caption/message
        // Using simple bolding compatible with 'Markdown' or just plain text to avoid parse errors
        const header = `📨 *New Feedback for ${restaurantName}*`
        const fullCaption = comment ? `${header}\n\n${comment}` : header

        // 2. Send based on photo count
        if (photos.length === 0) {
            // Text only
            await sendTelegramMessage(chatId, fullCaption)

        } else if (photos.length === 1) {
            // Single Photo with Caption
            await sendTelegramPhoto(chatId, photos[0], fullCaption)

        } else {
            // Media Group (Album)
            await sendTelegramMediaGroup(chatId, photos, fullCaption)
        }

        return { success: true }

    } catch (e: any) {
        console.error("Error sending feedback:", e)
        return { success: false, error: e.message || "Failed to send" }
    }
}

async function sendTelegramMessage(chatId: string, text: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown', // Legacy Markdown
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Telegram API Error: ${err}`)
    }
}

async function sendTelegramPhoto(chatId: string, photo: File, caption: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
    const formData = new FormData()
    formData.append('chat_id', chatId)
    formData.append('photo', photo)
    formData.append('caption', caption)
    formData.append('parse_mode', 'Markdown')

    const res = await fetch(url, {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Telegram API Error (Photo): ${err}`)
    }
}

async function sendTelegramMediaGroup(chatId: string, photos: File[], caption: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`
    const formData = new FormData()
    formData.append('chat_id', chatId)

    const media = photos.map((photo, index) => ({
        type: 'photo',
        media: `attach://photo_${index}`,
        caption: index === 0 ? caption : '', // Caption only on the first item
        parse_mode: 'Markdown'
    }))

    formData.append('media', JSON.stringify(media))

    photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo)
    })

    const res = await fetch(url, {
        method: 'POST',
        body: formData,
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Telegram API Error (MediaGroup): ${err}`)
    }
}
