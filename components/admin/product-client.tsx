"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea" // Assuming I'll add this
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Database } from "@/types/supabase"
import imageCompression from 'browser-image-compression'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

// Helper for option choices
import { useTranslations } from "next-intl"

// Sub-component for managing choices within a group
function OptionChoices({ nestIndex, control }: { nestIndex: number, control: any }) {
    const t = useTranslations('Admin')
    const { fields, append, remove } = useFieldArray({
        control,
        name: `options.${nestIndex}.choices`,
    })

    return (
        <div className="space-y-2 mt-2 pl-4 border-l-2">
            <FormLabel className="text-xs text-muted-foreground">{t('choices')}</FormLabel>
            {fields.map((item, k) => (
                <div key={item.id} className="flex gap-2 items-end">
                    <FormField
                        control={control}
                        name={`options.${nestIndex}.choices.${k}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormControl>
                                    <Input placeholder={t('choice_placeholder')} {...field} />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name={`options.${nestIndex}.choices.${k}.price`}
                        render={({ field }) => (
                            <FormItem className="w-24">
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="+Price" // Keeping simplified or add key if needed, let's use +Price or t('price')
                                        {...field}
                                        value={field.value}
                                        onChange={e => field.onChange(e.target.valueAsNumber)}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(k)} className="h-10 w-10">
                        <span className="sr-only">{t('delete')}</span>
                        X
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ name: "", price: 0 })}
            >
                {t('add_choice')}
            </Button>
        </div>
    )
}

export function ProductClient({
    initialProducts,
    categories,
    restaurantId
}: {
    initialProducts: Product[],
    categories: Category[],
    restaurantId: string
}) {
    const t = useTranslations('Admin')
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    // Helper for option choices
    const choiceSchema = z.object({
        name: z.string().min(1),
        price: z.coerce.number().default(0),
    })

    // Helper for option groups
    const optionGroupSchema = z.object({
        id: z.string().optional(),
        name: z.string().min(1, t('group_name') + " required"),
        type: z.enum(["single", "multiple"]),
        choices: z.array(choiceSchema).default([]),
    })

    const formSchema = z.object({
        category_id: z.string().min(1, t('category') + " required"),
        name_en: z.string().min(1, t('name_en') + " required"),
        name_ru: z.string().min(1, t('name_ru') + " required"),
        name_kz: z.string().min(1, t('name_kz') + " required"),
        description_en: z.string().optional(),
        description_ru: z.string().optional(),
        description_kz: z.string().optional(),
        price: z.coerce.number().min(0),
        image_url: z.string().optional(),
        options: z.array(optionGroupSchema).default([]),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            category_id: "",
            name_en: "",
            name_ru: "",
            name_kz: "",
            description_en: "",
            description_ru: "",
            description_kz: "",
            price: 0,
            image_url: "",
            options: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    })

    function handleEdit(product: Product) {
        setEditingProduct(product)

        // Data Migration: Handle legacy simple options if they exist
        const rawOptions = (product.options as any) || []
        let normalizedOptions = []

        if (rawOptions.length > 0 && rawOptions[0].price !== undefined && !rawOptions[0].choices) {
            normalizedOptions = [{
                id: crypto.randomUUID(),
                name: "Options",
                type: "multiple",
                choices: rawOptions.map((opt: any) => ({
                    name: opt.name,
                    price: opt.price || 0
                }))
            }]
        } else {
            normalizedOptions = rawOptions
        }

        form.reset({
            category_id: product.category_id || "",
            name_en: product.name_en,
            name_ru: product.name_ru,
            name_kz: product.name_kz,
            description_en: product.description_en || "",
            description_ru: product.description_ru || "",
            description_kz: product.description_kz || "",
            price: product.price,
            image_url: product.image_url || "",
            options: normalizedOptions,
        })
        setIsOpen(true)
    }

    function handleAddNew() {
        setEditingProduct(null)
        form.reset({
            category_id: "",
            name_en: "",
            name_ru: "",
            name_kz: "",
            description_en: "",
            description_ru: "",
            description_kz: "",
            price: 0,
            image_url: "",
            options: [],
        })
        setIsOpen(true)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            let result
            if (editingProduct) {
                const { data, error } = await supabase
                    .from('products')
                    .update(values)
                    .eq('id', editingProduct.id)
                    .select()
                    .single()
                result = { data, error }
            } else {
                const { data, error } = await supabase
                    .from('products')
                    .insert([{ ...values, restaurant_id: restaurantId }])
                    .select()
                    .single()
                result = { data, error }
            }

            if (result.error) throw result.error

            if (editingProduct) {
                setProducts((prev) => prev.map(p => p.id === editingProduct.id ? result.data : p))
            } else {
                setProducts((prev) => [...prev, result.data])
            }

            setIsOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            console.error("Error saving product:", error)
            alert(t('error_saving'))
        }
    }

    async function deleteProduct(id: string) {
        if (!confirm(t('confirm_delete'))) return

        const { error } = await supabase.from('products').delete().eq('id', id)
        if (error) {
            alert(t('error_deleting'))
        } else {
            setProducts((prev) => prev.filter(p => p.id !== id))
            router.refresh()
        }
    }

    // Get category name helper
    const getCatName = (id: string | null) => categories.find(c => c.id === id)?.name_en || 'Unknown'

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div></div> {/* Spacer or Search input placeholder */}
                <Dialog open={isOpen} onOpenChange={(open) => {
                    setIsOpen(open)
                    if (!open) setEditingProduct(null)
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>{t('add_product')}</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? t('edit_product') : t('add_product')}</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('category')}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={t('select_category')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((c) => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.name_en}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name_en"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('name_en')}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Burger" {...field} />
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
                                                    <Input placeholder="Бургер" {...field} />
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
                                                    <Input placeholder="Бургер" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('price')}</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
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
                                            <FormLabel>{t('product_image')}</FormLabel>
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
                                                                const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`

                                                                const { error: uploadError } = await supabase.storage
                                                                    .from('products')
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
                                                        <div className="relative aspect-square w-24 overflow-hidden rounded-md border">
                                                            <img
                                                                src={field.value}
                                                                alt="Product preview"
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

                                {/* Option Groups Section */}
                                <div className="space-y-4 border rounded-md p-4">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-base">{t('option_groups')}</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => append({ name: "New Group", type: "single", choices: [] })}
                                        >
                                            {t('add_group')}
                                        </Button>
                                    </div>

                                    {fields.map((field, index) => (
                                        <div key={field.id} className="space-y-3 p-3 border rounded bg-secondary/10">
                                            <div className="flex gap-4 items-end">
                                                <FormField
                                                    control={form.control}
                                                    name={`options.${index}.name`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormLabel>{t('group_name')}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Size" {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                                    <span className="sr-only">{t('delete_group')}</span>
                                                    X
                                                </Button>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name={`options.${index}.type`}
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel>{t('type')}</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="single">{t('single_pick')}</SelectItem>
                                                                <SelectItem value="multiple">{t('multiple_pick')}</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Inner Choices */}
                                            <OptionChoices nestIndex={index} control={form.control} />
                                        </div>
                                    ))}
                                </div>

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
                            <TableHead>{t('category')}</TableHead>
                            <TableHead>{t('price')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name_en}</TableCell>
                                <TableCell>{getCatName(product.category_id)}</TableCell>
                                <TableCell>{product.price}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>{t('edit')}</Button>
                                    <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>{t('delete')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    {t('no_products')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
