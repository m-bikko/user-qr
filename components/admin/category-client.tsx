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

type Category = Database['public']['Tables']['categories']['Row']

import { useTranslations } from "next-intl"

export function CategoryClient({ initialCategories }: { initialCategories: Category[] }) {
    const t = useTranslations('Admin')
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const formSchema = z.object({
        name_en: z.string().min(1, t('name_en') + " required"), // Simplified validation msg for now
        name_ru: z.string().min(1, t('name_ru') + " required"),
        name_kz: z.string().min(1, t('name_kz') + " required"),
        sort_order: z.coerce.number().int().default(0),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name_en: "",
            name_ru: "",
            name_kz: "",
            sort_order: 0,
        },
    })

    function handleEdit(category: Category) {
        setEditingCategory(category)
        form.reset({
            name_en: category.name_en,
            name_ru: category.name_ru,
            name_kz: category.name_kz,
            sort_order: category.sort_order,
        })
        setIsOpen(true)
    }

    function handleAddNew() {
        setEditingCategory(null)
        form.reset({
            name_en: "",
            name_ru: "",
            name_kz: "",
            sort_order: 0,
        })
        setIsOpen(true)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let result
            if (editingCategory) {
                const { data, error } = await supabase
                    .from('categories')
                    .update(values)
                    .eq('id', editingCategory.id)
                    .select()
                    .single()
                result = { data, error }
            } else {
                const { data, error } = await supabase
                    .from('categories')
                    .insert([values])
                    .select()
                    .single()
                result = { data, error }
            }

            if (result.error) throw result.error

            if (editingCategory) {
                setCategories((prev) => prev.map(c => c.id === editingCategory.id ? result.data : c))
            } else {
                setCategories((prev) => [...prev, result.data])
            }

            setIsOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error("Error saving category:", error)
            alert(t('error_saving'))
        }
    }

    async function deleteCategory(id: string) {
        if (!confirm(t('confirm_delete'))) return

        const { error } = await supabase.from('categories').delete().eq('id', id)
        if (error) {
            alert(t('error_deleting'))
        } else {
            setCategories((prev) => prev.filter(c => c.id !== id))
            router.refresh()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div></div>
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) setEditingCategory(null) // reset on close
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>{t('add_category')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? t('edit_category') : t('add_category')}</DialogTitle>
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
                                                <Input placeholder="Drinks" {...field} />
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
                                                <Input placeholder="Напитки" {...field} />
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
                                                <Input placeholder="Сусындар" {...field} />
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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('name_en')}</TableHead>
                            <TableHead>{t('name_ru')}</TableHead>
                            <TableHead>{t('name_kz')}</TableHead>
                            <TableHead>{t('sort_order')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name_en}</TableCell>
                                <TableCell>{category.name_ru}</TableCell>
                                <TableCell>{category.name_kz}</TableCell>
                                <TableCell>{category.sort_order}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>{t('edit')}</Button>
                                    <Button variant="destructive" size="sm" onClick={() => deleteCategory(category.id)}>{t('delete')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('no_categories')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
