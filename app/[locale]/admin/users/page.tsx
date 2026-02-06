import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { UserClient } from "@/components/admin/user-client"

export default async function UsersPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/${locale}/login`)
    }

    // Verify Super Admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'super_admin') {
        redirect(`/${locale}/admin`)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground">Manage user roles and restaurant assignments.</p>
                </div>
            </div>
            <UserClient />
        </div>
    )
}
