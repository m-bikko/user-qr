"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push("/en/login") // Default to EN login, or detect locale?
                // Better: just /login and let middleware handle it?
                // Problem: /login might default to /kz/login.
                // Let's rely on middleware: router.push('/login') might fail if not handled by Link.
                // Let's prefer hard redirect to /admin/login relative to current path?
                // Actually, let's just push to /en/login for now or try to extract locale.
            } else {
                setAuthorized(true)
            }
            setLoading(false)
        }

        checkAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setAuthorized(false)
                router.push("/en/login")
            } else if (session) {
                setAuthorized(true)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

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
