"use client"

import { useState } from "react"
import { Database } from "@/types/supabase"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/store/cart-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

type Product = Database['public']['Tables']['products']['Row']
type ProductChoice = { name: string, price: number }
type OptionGroup = {
    id: string
    name: string
    type: 'single' | 'multiple'
    choices: ProductChoice[]
}

export function ProductDetailClient({
    product,
    recommendations
}: {
    product: Product,
    recommendations: Product[]
}) {
    const router = useRouter()
    const t = useTranslations('Index')
    const locale = useLocale()
    const { addItem } = useCartStore()
    const [quantity, setQuantity] = useState(1)

    const getLocalized = (obj: any, field: string) => {
        return obj[`${field}_${locale}`] || obj[`${field}_en`] || ""
    }

    // State to track selections per group. Key is group name.
    const [selections, setSelections] = useState<Record<string, ProductChoice[]>>({})

    // Parse options appropriately for groups
    const rawOptions = (product.options as any) || []
    let groups: OptionGroup[] = []

    // Normalize legacy data if necessary
    if (rawOptions.length > 0) {
        if (rawOptions[0].choices) {
            // New structure
            groups = rawOptions
        } else {
            // Legacy flat structure -> convert to one "Options" group
            groups = [{
                id: "legacy-group",
                name: t('options'),
                type: "multiple",
                choices: rawOptions.map((o: any) => ({ name: o.name, price: o.price || 0 }))
            }]
        }
    }

    const handleSingleSelect = (groupName: string, choice: ProductChoice) => {
        setSelections(prev => ({
            ...prev,
            [groupName]: [choice]
        }))
    }

    const handleMultiSelect = (groupName: string, choice: ProductChoice, checked: boolean) => {
        setSelections(prev => {
            const current = prev[groupName] || []
            if (checked) {
                // Add if not exists
                if (!current.some(c => c.name === choice.name)) {
                    return { ...prev, [groupName]: [...current, choice] }
                }
                return prev
            } else {
                // Remove
                return { ...prev, [groupName]: current.filter(c => c.name !== choice.name) }
            }
        })
    }

    const handleAddToCart = () => {
        // Validation: Check if single-select groups have a value
        const missingRequired = groups.filter(g => g.type === 'single' && (!selections[g.name] || selections[g.name].length === 0))

        if (missingRequired.length > 0) {
            alert(`${t('select_option')}: ${missingRequired.map(g => g.name).join(', ')}`)
            return
        }

        // Flatten selections for cart
        const cartOptions = Object.entries(selections).flatMap(([groupName, choices]) =>
            choices.map(c => ({
                name: groupName === 'Options' || groupName === t('options') ? c.name : `${groupName}: ${c.name}`,
                price: c.price
            }))
        )

        addItem(product, quantity, cartOptions)
        router.back()
    }

    // Calculate total price
    const optionsTotal = Object.values(selections).flat().reduce((acc, c) => acc + c.price, 0)
    const totalPrice = (product.price + optionsTotal) * quantity

    const productName = getLocalized(product, 'name')
    const productDesc = getLocalized(product, 'description')

    return (
        <div className="container max-w-lg mx-auto p-4 space-y-6 pb-24">
            <Button variant="ghost" className="pl-0 gap-2 mb-4" onClick={() => router.back()}>
                <ChevronLeft className="w-4 h-4" /> {t('back_to_menu')}
            </Button>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted">
                {product.image_url ? (
                    <Image src={product.image_url} alt={productName} fill className="object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">{t('no_image')}</div>
                )}
            </div>

            <div>
                <h1 className="text-2xl font-bold">{productName}</h1>
                <div className="text-xl font-medium text-primary mt-1">{product.price} ₸</div>
                <p className="text-muted-foreground mt-2">{productDesc}</p>
            </div>

            {groups.length > 0 && (
                <div className="space-y-6 border-t pt-6">
                    {groups.map((group, idx) => (
                        <div key={idx} className="space-y-3">
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            {group.type === 'single' ? (
                                <RadioGroup
                                    onValueChange={(val) => {
                                        const choice = group.choices.find(c => c.name === val)
                                        if (choice) handleSingleSelect(group.name, choice)
                                    }}
                                    className="space-y-3"
                                >
                                    {group.choices.map((choice, cIdx) => (
                                        <div key={cIdx} className="flex items-center justify-between border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <RadioGroupItem value={choice.name} id={`g${idx}-c${cIdx}`} />
                                                <Label htmlFor={`g${idx}-c${cIdx}`} className="cursor-pointer font-normal">{choice.name}</Label>
                                            </div>
                                            {choice.price > 0 && <span className="text-sm font-medium text-primary">+{choice.price} ₸</span>}
                                        </div>
                                    ))}
                                </RadioGroup>
                            ) : (
                                <div className="space-y-3">
                                    {group.choices.map((choice, cIdx) => {
                                        const isChecked = selections[group.name]?.some(c => c.name === choice.name) || false
                                        return (
                                            <div key={cIdx} className="flex items-center justify-between border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`g${idx}-c${cIdx}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => handleMultiSelect(group.name, choice, checked as boolean)}
                                                    />
                                                    <Label htmlFor={`g${idx}-c${cIdx}`} className="cursor-pointer font-normal">{choice.name}</Label>
                                                </div>
                                                {choice.price > 0 && <span className="text-sm font-medium text-primary">+{choice.price} ₸</span>}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Quantity & Add */}
            <div className="flex items-center gap-4 border-t pt-4">
                <div className="flex items-center border rounded-md h-12">
                    <Button variant="ghost" size="icon" className="h-full px-4 rounded-none" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button variant="ghost" size="icon" className="h-full px-4 rounded-none" onClick={() => setQuantity(quantity + 1)}>+</Button>
                </div>
                <Button className="flex-1 h-12 text-lg" onClick={handleAddToCart}>
                    {t('add_to_order')} - {totalPrice} ₸
                </Button>
            </div>

            {recommendations.length > 0 && (
                <div className="space-y-4 border-t pt-6 mt-6">
                    <h3 className="font-bold text-lg">{t('recommended')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {recommendations.map(rec => (
                            <Link key={rec.id} href={`/${locale}/product/${rec.id}`} className="block space-y-2 group">
                                <div className="relative aspect-square rounded-lg bg-muted overflow-hidden">
                                    {rec.image_url && <Image src={rec.image_url} alt={getLocalized(rec, 'name')} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />}
                                </div>
                                <div>
                                    <div className="font-medium line-clamp-1">{getLocalized(rec, 'name')}</div>
                                    <div className="text-sm text-muted-foreground">{rec.price} ₸</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
