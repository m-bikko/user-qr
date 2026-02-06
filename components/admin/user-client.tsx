"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
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
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!editingProfile) return

        setSaving(true)
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
        } else {
            setIsDialogOpen(false)
            fetchData()
        }
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
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Restaurant</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            profiles.map((profile) => (
                                <TableRow key={profile.id}>
                                    <TableCell className="font-medium">{profile.email || "N/A"}</TableCell>
                                    <TableCell>
                                        <Badge variant={profile.role === 'super_admin' ? "default" : "secondary"}>
                                            {profile.role === 'super_admin' ? "Super Admin" : "Manager"}
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
                                            Edit
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
                        <DialogTitle>Edit User Profile</DialogTitle>
                        <DialogDescription>
                            Assign role and restaurant access for {editingProfile?.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select
                                value={role}
                                onValueChange={(val: 'super_admin' | 'restaurant_admin') => setRole(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="restaurant_admin">Restaurant Manager</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Super Admins can manage all restaurants. Managers are restricted to one restaurant.
                            </p>
                        </div>

                        {role === 'restaurant_admin' && (
                            <div className="space-y-2">
                                <Label>Assigned Restaurant</Label>
                                <Select
                                    value={restaurantId}
                                    onValueChange={setRestaurantId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a restaurant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Assignment (Read Only)</SelectItem>
                                        {restaurants.map(r => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
