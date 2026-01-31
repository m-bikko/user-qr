import { AdminGuard } from "@/components/auth/admin-guard"
import { AdminNav } from "@/components/admin/admin-nav"
import { useTranslations } from "next-intl"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = useTranslations('Admin')

    return (
        <AdminGuard>
            <div className="flex min-h-screen flex-col space-y-6">
                <header className="sticky top-0 z-40 border-b bg-background">
                    <div className="container flex h-16 items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                                    <SheetTitle className="sr-only">Menu</SheetTitle>
                                    <div className="px-1 py-6">
                                        <AdminNav />
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <div className="font-bold pl-2">{t('admin_title')}</div>
                        </div>
                        <LanguageSwitcher />
                    </div>
                </header>
                <div className="container grid flex-1 gap-12 md:grid-cols-[240px_1fr]">
                    <aside className="hidden w-[240px] flex-col md:flex pl-6">
                        <AdminNav />
                    </aside>
                    <main className="flex w-full flex-1 flex-col overflow-hidden">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    )
}
