"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserCog, Building } from "lucide-react"
import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"

type Profile = {
    id: string
    email: string | null
    role: 'super_admin' | 'restaurant_admin'
    restaurant_id: string | null
    created_at: string
}

type Restaurant = {
    id: string
    name: string
}

export function UserClient() {
    const t = useTranslations('Admin')
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    // Form State
    const [role, setRole] = useState<'super_admin' | 'restaurant_admin'>('restaurant_admin')
    const [restaurantId, setRestaurantId] = useState<string>("none")
    const [newPassword, setNewPassword] = useState("")

    const fetchData = async () => {
        setLoading(true)
        const [profilesRes, restaurantsRes] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('restaurants').select('id, name').order('name')
        ])

        if (profilesRes.data) setProfiles(profilesRes.data)
        if (restaurantsRes.data) setRestaurants(restaurantsRes.data)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleEdit = (profile: Profile) => {
        setEditingProfile(profile)
        setRole(profile.role)
        setRestaurantId(profile.restaurant_id || "none")
        setNewPassword("") // Reset password field
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!editingProfile) return

        setSaving(true)

        // 1. Update Profile Role/Restaurant
        const updates = {
            role,
            restaurant_id: restaurantId === "none" ? null : restaurantId
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', editingProfile.id)

        if (error) {
            alert("Error updating profile: " + error.message)
            setSaving(false)
            return
        }

        // 2. Update Password if provided
        if (newPassword && newPassword.trim() !== "") {
            // Import dynamically or at top level. 
            // Since this is a client component, we import the server action.
            const { updateUserPassword } = await import("@/actions/update-user-password")
            const result = await updateUserPassword(editingProfile.id, newPassword)

            if (!result.success) {
                alert("Profile updated, but password update failed: " + result.message)
            } else {
                // Password success
            }
        }

        setIsDialogOpen(false)
        fetchData()
        setSaving(false)
    }

    const getRestaurantName = (id: string | null) => {
        if (!id) return null
        return restaurants.find(r => r.id === id)?.name
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('email')}</TableHead>
                            <TableHead>{t('role')}</TableHead>
                            <TableHead>{t('assigned_restaurant')}</TableHead>
                            <TableHead>{t('joined')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : profiles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    {t('no_users_found')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.email || "N/A"}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'super_admin' ? "default" : "secondary"}>
                                            {profile.role === 'super_admin' ? t('super_admin') : t('manager')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {profile.restaurant_id ? (
                                            <div className="flex items-center gap-2">
                                                <Building className="h-3 w-3 text-muted-foreground" />
                                                <span>{getRestaurantName(profile.restaurant_id)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(profile.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(profile)}>
                                            <UserCog className="h-4 w-4 mr-2" />
                                            {t('edit')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('edit_user_profile')}</DialogTitle>
                        <DialogDescription>
                            {t('edit_user_description', { email: editingProfile?.email || "N/A" })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('role')}</Label>
                            <Select
                                value={role}
                                onValueChange={(val: 'super_admin' | 'restaurant_admin') => setRole(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="restaurant_admin">{t('restaurant_manager')}</SelectItem>
                                    <SelectItem value="super_admin">{t('super_admin')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {t('role_description')}
                            </p>
                        </div>

                        {role === 'restaurant_admin' && (
                            <div className="space-y-2">
                                <Label>{t('assigned_restaurant')}</Label>
                                <Select
                                    value={restaurantId}
                                    onValueChange={setRestaurantId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('select_restaurant_ph')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">{t('no_assignment')}</SelectItem>
                                        {restaurants.map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="new-password">{t('change_password')}</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder={t('new_password_placeholder')}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t('password_hint')}
                            </p>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('save_changes')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
