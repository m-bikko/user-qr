'use server'

import { cookies } from 'next/headers'

export async function setAdminContext(restaurantId: string) {
    const cookieStore = await cookies()
    cookieStore.set('admin_context_restaurant_id', restaurantId)
}

export async function clearAdminContext() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_context_restaurant_id')
}
