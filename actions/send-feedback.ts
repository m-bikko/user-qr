'use server'

import { createClient } from "@/lib/supabase-server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Helper to escape HTML characters for Telegram
function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function sendFeedbackAction(formData: FormData) {
    if (!TELEGRAM_BOT_TOKEN) {
        return { success: false, error: "Bot not configured" }
    }

    const restaurantId = formData.get('restaurantId') as string
    const comment = formData.get('comment') as string
    const rating = formData.get('rating') as string || 'N/A' // Handle potential legacy calls

    // Extract photos
    const photos: File[] = []
    for (let i = 0; i < 3; i++) {
        const photo = formData.get(`photo_${i}`)
        if (photo instanceof File) {
            // Validate file type (server-side check)
            if (photo.type === 'image/jpeg' || photo.type === 'image/png') {
                photos.push(photo)
            } else {
                console.warn(`Skipping unsupported file type: ${photo.type}`)
            }
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

        // Construct the caption/message using HTML
        // const header = `📨 <b>New Feedback for ${escapeHtml(restaurantName)}</b>`
        let fullCaption = `<b>Рейтинг пользователя:</b> ${rating}/5⭐`

        if (comment) {
            fullCaption += `\n<b>Отзыв пользователя:</b>\n<blockquote>${escapeHtml(comment)}</blockquote>`
        }

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
            parse_mode: 'HTML',
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

    const buffer = Buffer.from(await photo.arrayBuffer())

    // Ensure filename has an extension and is safe
    let filename = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    if (!filename.includes('.')) filename += '.jpg'

    // valid for environment with global FormData (Node 18+)
    formData.append('photo', new Blob([buffer]), filename)
    formData.append('caption', caption)
    formData.append('parse_mode', 'HTML')

    const res = await fetch(url, {
        method: 'POST',
        // @ts-ignore
        body: formData,
    })

    if (!res.ok) {
        const err = await res.text()
        console.error("Telegram Photo Error Response:", err)
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
        parse_mode: 'HTML'
    }))

    formData.append('media', JSON.stringify(media))

    // Use sequential loop to ensure deterministic order and avoid race conditions
    for (let index = 0; index < photos.length; index++) {
        const photo = photos[index]
        const buffer = Buffer.from(await photo.arrayBuffer())

        // Ensure filename has an extension and is safe
        let filename = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        if (!filename.includes('.')) filename += '.jpg'

        const blob = new Blob([buffer], { type: photo.type || 'image/jpeg' })
        formData.append(`photo_${index}`, blob, filename)
    }

    const res = await fetch(url, {
        method: 'POST',
        // @ts-ignore
        body: formData,
    })

    if (!res.ok) {
        const err = await res.text()
        console.error("Telegram MediaGroup Error Response:", err)
        throw new Error(`Telegram API Error (MediaGroup): ${err}`)
    }
}
