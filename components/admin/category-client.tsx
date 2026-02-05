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

type Category = Database['public']['Tables']['categories']['Row']

import { useTranslations } from "next-intl"

function SortableRow({ category, onEdit, onDelete }: { category: Category, onEdit: (c: Category) => void, onDelete: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id })

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
            <TableCell className="font-medium">{category.name_en}</TableCell>
            <TableCell>{category.name_ru}</TableCell>
            <TableCell>{category.name_kz}</TableCell>
            <TableCell>{category.sort_order}</TableCell>
            <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(category)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => onDelete(category.id)}>Delete</Button>
            </TableCell>
        </TableRow>
    )
}

export function CategoryClient({ initialCategories, restaurantId, kitchens }: { initialCategories: Category[], restaurantId: string, kitchens: Database['public']['Tables']['kitchens']['Row'][] }) {
    const t = useTranslations('Admin')
    const [categories, setCategories] = useState<Category[]>(initialCategories)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const [editingCategory, setEditingCategory] = useState<Category | null>(null)

    const formSchema = z.object({
        name_en: z.string().min(1, t('name_en') + " required"),
        name_ru: z.string().min(1, t('name_ru') + " required"),
        name_kz: z.string().min(1, t('name_kz') + " required"),
        sort_order: z.coerce.number().int().default(0),
        kitchen_id: z.string().min(1, t('select_kitchen') + " required"),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name_en: "",
            name_ru: "",
            name_kz: "",
            sort_order: 0,
            kitchen_id: "",
        },
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleEdit(category: Category) {
        setEditingCategory(category)
        form.reset({
            name_en: category.name_en,
            name_ru: category.name_ru,
            name_kz: category.name_kz,
            sort_order: category.sort_order,
            kitchen_id: category.kitchen_id || "",
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
            kitchen_id: "",
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
                    .insert([{ ...values, restaurant_id: restaurantId }])
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

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const activeCategory = categories.find(c => c.id === active.id)
        const overCategory = categories.find(c => c.id === over.id)

        if (!activeCategory || !overCategory || activeCategory.kitchen_id !== overCategory.kitchen_id) {
            return
        }

        const kitchenId = activeCategory.kitchen_id

        // Get categories for this kitchen, explicitly sorted by current view order
        // Note: We need to rely on the current state's order to determine indices
        const currentKitchenCategories = categories
            .filter(c => c.kitchen_id === kitchenId)
            .sort((a, b) => a.sort_order - b.sort_order)

        const oldIndex = currentKitchenCategories.findIndex(c => c.id === active.id)
        const newIndex = currentKitchenCategories.findIndex(c => c.id === over.id)

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(currentKitchenCategories, oldIndex, newIndex)

            // Generate updates with new sort_orders
            const updates = newOrder.map((cat, index) => ({
                ...cat,
                sort_order: index
            }))

            // Optimistically update state
            setCategories((prev) => {
                const remaining = prev.filter(c => c.kitchen_id !== kitchenId)
                return [...remaining, ...updates].sort((a, b) => a.sort_order - b.sort_order)
            })

            // Update in DB
            Promise.all(updates.map(u =>
                supabase.from('categories').update({ sort_order: u.sort_order }).eq('id', u.id)
            )).catch(err => {
                console.error("Error reordering:", err)
                alert("Error reordering categories")
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
                    <div></div>
                    <Dialog open={isOpen} onOpenChange={(open) => {
                        setIsOpen(open)
                        if (!open) setEditingCategory(null)
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
                                        name="kitchen_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('kitchen')}</FormLabel>
                                                <div className="relative">
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        {...field}
                                                    >
                                                        <option value="" disabled>{t('select_kitchen')}</option>
                                                        {kitchens.map((k) => (
                                                            <option key={k.id} value={k.id}>
                                                                {k.name_en}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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

                <div className="space-y-8">
                    {kitchens.map((kitchen) => {
                        const kitchenCategories = categories
                            .filter(c => c.kitchen_id === kitchen.id)
                            .sort((a, b) => a.sort_order - b.sort_order)

                        return (
                            <div key={kitchen.id} className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {kitchen.name_en}
                                    <span className="text-sm font-normal text-muted-foreground">
                                        {kitchen.name_ru && ` / ${kitchen.name_ru}`}
                                    </span>
                                </h3>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]"></TableHead>
                                                <TableHead>{t('name_en')}</TableHead>
                                                <TableHead>{t('name_ru')}</TableHead>
                                                <TableHead>{t('name_kz')}</TableHead>
                                                <TableHead>{t('sort_order')}</TableHead>
                                                <TableHead className="text-right">{t('actions')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <SortableContext items={kitchenCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                {kitchenCategories.map((category) => (
                                                    <SortableRow
                                                        key={category.id}
                                                        category={category}
                                                        onEdit={handleEdit}
                                                        onDelete={deleteCategory}
                                                    />
                                                ))}
                                            </SortableContext>
                                            {kitchenCategories.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        {t('no_categories', { defaultMessage: "No categories in this kitchen" })}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )
                    })}

                    {/* Handle categories with no kitchen assigned */}
                    {categories.filter(c => !c.kitchen_id).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-destructive flex items-center gap-2">
                                Unassigned
                            </h3>
                            <div className="rounded-md border border-destructive/50">
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
                                        {categories.filter(c => !c.kitchen_id).map((category) => (
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
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DndContext>
    )
}
