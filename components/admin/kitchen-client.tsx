"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Database } from "@/types/supabase"
import { useTranslations } from "next-intl"
import imageCompression from 'browser-image-compression'

type Kitchen = Database['public']['Tables']['kitchens']['Row']

export function KitchenClient({ initialKitchens, restaurantId }: { initialKitchens: Kitchen[], restaurantId: string }) {
    const t = useTranslations('Admin')
    const [kitchens, setKitchens] = useState<Kitchen[]>(initialKitchens)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const [editingKitchen, setEditingKitchen] = useState<Kitchen | null>(null)

    const formSchema = z.object({
        name_en: z.string().min(1, t('name_en') + " required"),
        name_ru: z.string().min(1, t('name_ru') + " required"),
        name_kz: z.string().min(1, t('name_kz') + " required"),
        sort_order: z.coerce.number().int().default(0),
        image_url: z.string().optional(),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name_en: "",
            name_ru: "",
            name_kz: "",
            sort_order: 0,
            image_url: "",
        },
    })

    function handleEdit(kitchen: Kitchen) {
        setEditingKitchen(kitchen)
        form.reset({
            name_en: kitchen.name_en,
            name_ru: kitchen.name_ru,
            name_kz: kitchen.name_kz,
            sort_order: kitchen.sort_order || 0,
            image_url: kitchen.image_url || "",
        })
        setIsOpen(true)
    }

    function handleAddNew() {
        setEditingKitchen(null)
        form.reset({
            name_en: "",
            name_ru: "",
            name_kz: "",
            sort_order: 0,
            image_url: "",
        })
        setIsOpen(true)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let result
            if (editingKitchen) {
                const { data, error } = await supabase
                    .from('kitchens')
                    .update(values)
                    .eq('id', editingKitchen.id)
                    .select()
                    .single()
                result = { data, error }
            } else {
                const { data, error } = await supabase
                    .from('kitchens')
                    .insert([{ ...values, restaurant_id: restaurantId }])
                    .select()
                    .single()
                result = { data, error }
            }

            if (result.error) throw result.error

            if (editingKitchen) {
                setKitchens((prev) => prev.map(k => k.id === editingKitchen.id ? result.data : k))
            } else {
                setKitchens((prev) => [...prev, result.data])
            }

            setIsOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error("Error saving kitchen:", error)
            alert(t('error_saving', { defaultMessage: 'Error saving' }))
        }
    }

    async function deleteKitchen(id: string) {
        if (!confirm(t('confirm_delete'))) return

        const { error } = await supabase.from('kitchens').delete().eq('id', id)
        if (error) {
            alert(t('error_deleting'))
        } else {
            setKitchens((prev) => prev.filter(k => k.id !== id))
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div></div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) setEditingKitchen(null)
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>{t('add_kitchen', { defaultMessage: 'Add Kitchen' })}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingKitchen ? t('edit_kitchen', { defaultMessage: 'Edit Kitchen' }) : t('add_kitchen', { defaultMessage: 'Add Kitchen' })}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name_en"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('name_en')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Main Kitchen" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name_ru"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('name_ru')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Основная Кухня" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name_kz"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('name_kz')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Негізгі Асхана" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="image_url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('product_image', { defaultMessage: 'Image' })}</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (!file) return

                                                            try {
                                                                const compressedFile = await imageCompression(file, {
                                                                    maxSizeMB: 1,
                                                                    maxWidthOrHeight: 1024,
                                                                    useWebWorker: true
                                                                })

                                                                const fileExt = file.name.split('.').pop()
                                                                const fileName = `kitchen_${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`

                                                                const { error: uploadError } = await supabase.storage
                                                                    .from('products') // Reusing products bucket
                                                                    .upload(fileName, compressedFile)

                                                                if (uploadError) throw uploadError

                                                                const { data: { publicUrl } } = supabase.storage
                                                                    .from('products')
                                                                    .getPublicUrl(fileName)

                                                                field.onChange(publicUrl)
                                                            } catch (error) {
                                                                console.error("Error uploading image:", error)
                                                                alert("Error uploading image")
                                                            }
                                                        }}
                                                    />
                                                    {field.value && (
                                                        <div className="relative aspect-video w-32 overflow-hidden rounded-md border">
                                                            <img
                                                                src={field.value}
                                                                alt="Kitchen preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="sort_order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('sort_order')}</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit">{t('save')}</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[700px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>{t('name_en')}</TableHead>
                            <TableHead>{t('name_ru')}</TableHead>
                            <TableHead>{t('name_kz')}</TableHead>
                            <TableHead>{t('sort_order')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {kitchens.map((kitchen) => (
                            <TableRow key={kitchen.id}>
                                <TableCell>
                                    {kitchen.image_url && (
                                        <div className="h-10 w-16 overflow-hidden rounded bg-muted">
                                            <img src={kitchen.image_url} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{kitchen.name_en}</TableCell>
                                <TableCell>{kitchen.name_ru}</TableCell>
                                <TableCell>{kitchen.name_kz}</TableCell>
                                <TableCell>{kitchen.sort_order}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(kitchen)}>{t('edit')}</Button>
                                    <Button variant="destructive" size="sm" onClick={() => deleteKitchen(kitchen.id)}>{t('delete')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {kitchens.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {t('no_kitchens', { defaultMessage: 'No kitchens found' })}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
