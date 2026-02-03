"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push(`/${locale}/login`)
            } else {
                setAuthorized(true)
            }
            setLoading(false)
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setAuthorized(false)
                router.push(`/${locale}/login`)
            } else if (session) {
                setAuthorized(true)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router, locale])

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!authorized) {
        return null // Will redirect
    }

    return <>{children}</>
}
