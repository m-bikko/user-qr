"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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
import { useRouter, useParams } from "next/navigation"
import { Database } from "@/types/supabase"
import imageCompression from 'browser-image-compression'
import { useTranslations } from "next-intl"
import { GripVertical } from "lucide-react"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Kitchen = Database['public']['Tables']['kitchens']['Row']

function SortableRow({ product, onEdit, onDelete, locale }: { product: Product, onEdit: (p: Product) => void, onDelete: (id: string) => void, locale: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: isDragging ? 'relative' as const : undefined,
    }

    return (
        <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted/50" : ""}>
            <TableCell className="w-[50px]">
                <button {...attributes} {...listeners} className="cursor-grab hover:text-primary">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                </button>
            </TableCell>
            <TableCell className="font-medium">
                <div className="flex flex-col">
                    <span>{product.name_en}</span>
                    {locale !== 'en' && (
                        <span className="text-xs text-muted-foreground">
                            {product[`name_${locale}` as keyof typeof product] as string}
                        </span>
                    )}
                </div>
            </TableCell>
            <TableCell>{product.price}</TableCell>
            <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(product)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(product.id)}>Delete</Button>
            </TableCell>
        </TableRow>
    )
}

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
                                        placeholder="+Price"
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
    kitchens,
    restaurantId
}: {
    initialProducts: Product[],
    categories: Category[],
    kitchens: Kitchen[],
    restaurantId: string
}) {
    const t = useTranslations('Admin')
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'

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
        sort_order: z.coerce.number().int().default(0),
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
            sort_order: 0,
        },
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

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
            sort_order: product.sort_order || 0,
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
            sort_order: 0,
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

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const activeProduct = products.find(p => p.id === active.id)
        const overProduct = products.find(p => p.id === over.id)

        if (!activeProduct || !overProduct || activeProduct.category_id !== overProduct.category_id) {
            return
        }

        const categoryId = activeProduct.category_id

        // Get products for this category, explicitly sorted
        const currentCategoryProducts = products
            .filter(p => p.category_id === categoryId)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

        const oldIndex = currentCategoryProducts.findIndex(p => p.id === active.id)
        const newIndex = currentCategoryProducts.findIndex(p => p.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentCategoryProducts, oldIndex, newIndex)

            // Generate updates
            const updates = newOrder.map((prod, index) => ({
                ...prod,
                sort_order: index
            }))

            // Optimistically update
            setProducts((prev) => {
                const remaining = prev.filter(p => p.category_id !== categoryId)
                return [...remaining, ...updates].sort((a, b) => {
                    // Sort order: Category (Kitchen?), then products sort_order?
                    // Global sort might be complex, but for filtering it's fine.
                    // Let's just append updates.
                    return 0 // order doesn't matter for state as we filter+sort in render
                })
            })

            // Update DB
            Promise.all(updates.map(u =>
                supabase.from('products').update({ sort_order: u.sort_order }).eq('id', u.id)
            )).catch(err => {
                console.error("Error reordering:", err)
                alert("Error reordering products")
            })
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
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
                        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[85vh] overflow-y-auto">
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

                {/* Categories Loop */}
                <div className="space-y-8">
                    {
                        categories.map((category) => {
                            const categoryProducts = products
                                .filter(p => p.category_id === category.id)
                                .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

                            // Dynamic key access for localized name
                            const categoryName = category[`name_${locale}` as keyof typeof category] as string || category.name_en
                            const kitchen = kitchens.find(k => k.id === category.kitchen_id)
                            const kitchenName = kitchen ? (kitchen[`name_${locale}` as keyof typeof kitchen] as string || kitchen.name_en) : ''

                            return (
                                <div key={category.id} className="space-y-4">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        {kitchenName && <span className="text-muted-foreground font-medium">{kitchenName} &mdash;</span>}
                                        {categoryName}
                                        <span className="text-sm font-normal text-muted-foreground">({categoryProducts.length})</span>
                                    </h3>
                                    <div className="rounded-md border overflow-x-auto">
                                        <Table className="min-w-[600px]">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                    <TableHead>{t('name_en')}</TableHead>
                                                    <TableHead>{t('price')}</TableHead>
                                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                <SortableContext items={categoryProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                                                    {categoryProducts.map((product) => (
                                                        <SortableRow
                                                            key={product.id}
                                                            product={product}
                                                            onEdit={handleEdit}
                                                            onDelete={deleteProduct}
                                                            locale={locale}
                                                        />
                                                    ))}
                                                </SortableContext>
                                                {categoryProducts.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="h-16 text-center text-muted-foreground text-sm">
                                                            {t('no_products_in_category')}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )
                        })
                    }

                    {/* Uncategorized Products (if any) */}
                    {
                        products.filter(p => !p.category_id).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-muted-foreground">{t('uncategorized', { defaultMessage: 'Uncategorized' })}</h3>
                                <div className="rounded-md border overflow-x-auto">
                                    <Table className="min-w-[600px]">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t('name_en')}</TableHead>
                                                <TableHead>{t('price')}</TableHead>
                                                <TableHead className="text-right">{t('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.filter(p => !p.category_id).map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell className="font-medium">{product.name_en}</TableCell>
                                                    <TableCell>{product.price}</TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>{t('edit')}</Button>
                                                        <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>{t('delete')}</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
        </DndContext >
    )
}
