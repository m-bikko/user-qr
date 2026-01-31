import { supabase } from "@/lib/supabase"
import { CategoryClient } from "@/components/admin/category-client"

export default async function CategoriesPage() {
    const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) {
        return <div>Error loading categories</div>
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
            </div>
            <CategoryClient initialCategories={categories || []} />
        </div>
    )
}
