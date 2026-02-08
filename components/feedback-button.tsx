"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, Image as ImageIcon, X, Loader2, Send, Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { sendFeedbackAction } from "@/actions/send-feedback" // Server Action
import Image from "next/image"

export function FeedbackButton({ restaurantId, telegramChatId }: { restaurantId: string, telegramChatId: string | null }) {
    const t = useTranslations('Index') // Assuming general translations
    const [open, setOpen] = useState(false)
    const [comment, setComment] = useState("")
    const [rating, setRating] = useState(5)
    const [photos, setPhotos] = useState<File[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!telegramChatId) return null // Don't show if not configured

    // Manage previews
    useEffect(() => {
        if (photos.length === 0) {
            setPreviews([])
            return
        }

        const newPreviews = photos.map(file => URL.createObjectURL(file))
        setPreviews(newPreviews)

        // Cleanup function to revoke URLs when component unmounts or photos change
        return () => {
            newPreviews.forEach(url => URL.revokeObjectURL(url))
        }
    }, [photos])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)
            if (photos.length + newFiles.length > 3) {
                alert("Maximum 3 photos allowed")
                return
            }
            setPhotos(prev => [...prev, ...newFiles])
        }
    }

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!comment && photos.length === 0) return

        setLoading(true)

        // Convert files to base64 or FormData based on how we handle it
        const formData = new FormData()
        formData.append('restaurantId', restaurantId)
        formData.append('comment', comment)
        formData.append('rating', rating.toString())
        photos.forEach((photo, index) => {
            formData.append(`photo_${index}`, photo)
        })

        const result = await sendFeedbackAction(formData)

        setLoading(false)
        if (result.success) {
            setOpen(false)
            setComment("")
            setRating(5)
            setPhotos([])
            alert(t('feedback_sent'))
        } else {
            alert("Error sending feedback: " + result.error)
        }
    }

    return (
        <>
            <div className="fixed bottom-24 right-4 z-40">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full h-12 w-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('leave_feedback')}</DialogTitle>
                            <DialogDescription>
                                {t('feedback_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="flex justify-center mb-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className="p-1 transition-transform active:scale-95 focus:outline-none"
                                        >
                                            <Star
                                                className={`w-8 h-8 transition-colors ${star <= rating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-muted-foreground/30"
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('your_comment')} (Max 300 chars)</Label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, 300))}
                                    placeholder={t('feedback_placeholder')}
                                    className="resize-none h-32"
                                />
                                <div className="text-xs text-right text-muted-foreground">{comment.length}/300</div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('attach_photos')} (Max 3)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border">
                                            <Image
                                                src={src}
                                                alt="preview"
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                onClick={() => removePhoto(i)}
                                                className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl-md hover:bg-red-500 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {photos.length < 3 && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-16 h-16 rounded-md border-2 border-dashed border-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                        >
                                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSubmit} disabled={loading || (!comment && photos.length === 0)}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('send_feedback')}
                                <Send className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}
