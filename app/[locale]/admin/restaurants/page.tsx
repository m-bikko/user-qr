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
import { Plus, Loader2, Edit, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import imageCompression from 'browser-image-compression'
import { createRestaurantAction } from "@/actions/create-restaurant"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"

type Restaurant = {
    id: string
    name: string
    slug: string
    logo_url: string | null
    created_at: string
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
            setEmail("")
            setPassword("")
        } else {
            setEditingRestaurant(null)
            setName("")
            setSlug("")
            setLogoUrl("")
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
            alert("Email and Password are required for new restaurants")
            return
        }

        setSaving(true)

        if (editingRestaurant) {
            const payload = { name, slug, logo_url: logoUrl || null }
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
        if (!confirm("Are you sure? This will delete the restaurant and ALL associated data!")) return

        const { error } = await supabase.from('restaurants').delete().eq('id', id)
        if (error) {
            alert('Error deleting restaurant: ' + error.message)
        } else {
            fetchRestaurants()
        }
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t('restaurants')}</h2>
                    <p className="text-muted-foreground">Manage your restaurants platform-wide.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Restaurant
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRestaurant ? "Edit Restaurant" : "Add New Restaurant"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Restaurant Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value)
                                        handleGenerateSlug(e.target.value)
                                    }}
                                    placeholder="e.g. My Burger Joint"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="e.g. my-burger-joint"
                                />
                                <p className="text-xs text-muted-foreground">This will be used for the menu link: /{slug}</p>
                            </div>

                            {!editingRestaurant && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Admin Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@restaurant.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Admin Password</Label>
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
                                <Label>Logo</Label>
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
                                {editingRestaurant ? "Save Changes" : "Create Restaurant"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Logo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : restaurants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No restaurants found.
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
