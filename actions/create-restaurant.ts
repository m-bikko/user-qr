'use server'

import { createAdminClient } from "@/lib/supabase-admin"
import { revalidatePath } from "next/cache"

export async function createRestaurantAction(prevState: any, formData: FormData) {
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const logo_url = formData.get('logo_url') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !slug || !email || !password) {
        return { message: 'All fields are required' }
    }

    const supabase = createAdminClient()

    try {
        // 1. Create User
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (userError) {
            console.error('Error creating user:', userError)
            return { message: `Error creating user: ${userError.message}` }
        }

        const userId = userData.user.id

        // 2. Create Restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({ name, slug, logo_url })
            .select()
            .single()

        if (restaurantError) {
            console.error('Error creating restaurant:', restaurantError)
            // Rollback user creation? Ideally yes, but for now we just error.
            // In a real app, we'd delete the user here.
            await supabase.auth.admin.deleteUser(userId)
            return { message: `Error creating restaurant: ${restaurantError.message}` }
        }

        const restaurantId = restaurantData.id

        // 3. Update Profile (Link User to Restaurant & Set Role)
        // Profile should have been created by trigger on public.profiles.
        // We update it.
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                role: 'restaurant_admin',
                restaurant_id: restaurantId,
                email: email // Ensure email is synced if trigger didn't catch it perfectly or just to be safe
            })
            .eq('id', userId)

        if (profileError) {
            console.error('Error updating profile:', profileError)
            return { message: `Error assigning role: ${profileError.message}` }
        }

        revalidatePath('/[locale]/admin/restaurants', 'page')
        return { success: true, message: 'Restaurant and Admin created successfully' }

    } catch (e: any) {
        return { message: `Unexpected error: ${e.message}` }
    }
}
