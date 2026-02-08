"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Edit, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import imageCompression from 'browser-image-compression'
import { createRestaurantAction } from "@/actions/create-restaurant"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
// ... existing imports

type Restaurant = {
    id: string
    name: string
    slug: string
    logo_url: string | null
    created_at: string
    theme?: string
}

export default function RestaurantsPage() {
    const t = useTranslations('Admin')
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)

    // Form States
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [logoUrl, setLogoUrl] = useState("")
    const [theme, setTheme] = useState("default")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchRestaurants()
    }, [])

    const fetchRestaurants = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) {
            setRestaurants(data)
        }
        setLoading(false)
    }

    const handleGenerateSlug = (value: string) => {
        if (!editingRestaurant) {
            const newSlug = value
                .toLowerCase()
                .replace(/ /g, '-')
                .replace(/[^\w-]+/g, '')
            setSlug(newSlug)
        }
    }

    const handleOpenDialog = (restaurant?: Restaurant) => {
        if (restaurant) {
            setEditingRestaurant(restaurant)
            setName(restaurant.name)
            setSlug(restaurant.slug)
            setLogoUrl(restaurant.logo_url || "")
            setTheme(restaurant.theme || "default")
            setEmail("")
            setPassword("")
        } else {
            setEditingRestaurant(null)
            setName("")
            setSlug("")
            setLogoUrl("")
            setTheme("default")
            setEmail("")
            setPassword("")
        }
        setIsDialogOpen(true)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setSaving(true)
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 512,
                useWebWorker: true
            })

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`
            const filePath = `logos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('restaurants')
                .upload(filePath, compressedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('restaurants')
                .getPublicUrl(filePath)

            setLogoUrl(publicUrl)
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Error uploading image")
        } finally {
            setSaving(false)
        }
    }

    const handleSave = async () => {
        if (!name || !slug) return

        // For new restaurant, require email/password
        if (!editingRestaurant && (!email || !password)) {
            alert(t('email_required_error'))
            return
        }

        setSaving(true)

        if (editingRestaurant) {
            const payload = { name, slug, logo_url: logoUrl || null, theme }
            const { error } = await supabase
                .from('restaurants')
                .update(payload)
                .eq('id', editingRestaurant.id)

            if (error) {
                alert('Error using update: ' + error.message)
            } else {
                setIsDialogOpen(false)
                fetchRestaurants()
            }
        } else {
            // Create New Restaurant via Server Action
            const formData = new FormData()
            formData.append('name', name)
            formData.append('slug', slug)
            formData.append('logo_url', logoUrl)
            formData.append('theme', theme)
            formData.append('email', email)
            formData.append('password', password)

            const result = await createRestaurantAction(null, formData)

            // @ts-ignore
            if (result?.error || (result?.message && !result?.success)) {
                // @ts-ignore
                alert('Error: ' + (result?.message || 'Unknown error'))
            } else {
                setIsDialogOpen(false)
                fetchRestaurants()
            }
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm(t('delete_restaurant_confirm'))) return

        const { error } = await supabase.from('restaurants').delete().eq('id', id)
        if (error) {
            alert(t('error_deleting_restaurant') + error.message)
        } else {
            fetchRestaurants()
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('restaurants')}</h2>
                    <p className="text-muted-foreground">{t('manage_restaurants_description')}</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> {t('add_restaurant')}
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRestaurant ? t('edit_restaurant') : t('add_new_restaurant')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('restaurant_name')}</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value)
                                        handleGenerateSlug(e.target.value)
                                    }}
                                    placeholder={t('restaurant_name_placeholder')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">{t('url_slug')}</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder={t('url_slug_placeholder')}
                                />
                                <p className="text-xs text-muted-foreground">{t('slug_help', { slug: slug || 'your-restaurant' })}</p>
                            </div>

                            {!editingRestaurant && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('admin_email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@restaurant.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">{t('admin_password')}</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="******"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Theme</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default (Detailed)</SelectItem>
                                        <SelectItem value="modern">Modern (Grid)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('logo')}</Label>
                                <div className="flex items-center gap-4">
                                    {logoUrl && (
                                        <Avatar className="h-16 w-16">
                                            <AvatarImage src={logoUrl} className="object-cover" />
                                            <AvatarFallback>LG</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={saving} className="w-full">
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingRestaurant ? t('save_changes') : t('create_restaurant')}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('logo')}</TableHead>
                            <TableHead>{t('restaurant_name')}</TableHead>
                            <TableHead>{t('url_slug')}</TableHead>
                            <TableHead>{t('created_at')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('loading')}
                                </TableCell>
                            </TableRow>
                        ) : restaurants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('no_restaurants_found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            restaurants.map((restaurant) => (
                                <TableRow key={restaurant.id}>
                                    <TableCell>
                                        <Avatar className="h-8 w-8 rounded-sm">
                                            <AvatarImage src={restaurant.logo_url || undefined} className="object-cover" />
                                            <AvatarFallback className="rounded-sm">{restaurant.name.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{restaurant.name}</TableCell>
                                    <TableCell>{restaurant.slug}</TableCell>
                                    <TableCell>{new Date(restaurant.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(restaurant)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(restaurant.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
