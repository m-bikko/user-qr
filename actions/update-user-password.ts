"use server"

import { createAdminClient } from "@/lib/supabase-admin"
import { createClient } from "@/lib/supabase-server"

export async function updateUserPassword(userId: string, newPassword: string) {
    try {
        // 1. Check if the requester is a super_admin
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, message: "Unauthorized" }
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            return { success: false, message: "Only Super Admins can change passwords." }
        }

        // 2. Update the user's password using supabaseAdmin
        const supabaseAdmin = createAdminClient()
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword
        })

        if (error) {
            return { success: false, message: error.message }
        }

        return { success: true, message: "Password updated successfully." }

    } catch (error) {
        return { success: false, message: "An unexpected error occurred." }
    }
}
