import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
const adminEmail = process.env.ADMIN_EMAIL!
const adminPassword = process.env.ADMIN_PASSWORD!

if (!supabaseUrl || !supabaseKey || !adminEmail || !adminPassword) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
    console.log("Signing in...")
    const { error: authError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
    })

    if (authError) {
        console.error("Auth failed:", authError)
        return
    }

    console.log("Auth success. Seeding data...")

    const categoriesData = [
        { name_en: "Salads", name_ru: "Салаты", name_kz: "Салаттар", sort_order: 10 },
        { name_en: "Soups", name_ru: "Супы", name_kz: "Сорпалар", sort_order: 11 },
        { name_en: "Desserts", name_ru: "Десерты", name_kz: "Тәттілер", sort_order: 12 },
    ]

    const createdCategories = []

    for (const cat of categoriesData) {
        console.log(`Creating category ${cat.name_en}...`)
        const { data, error } = await supabase.from('categories').insert(cat).select().single()
        if (error) {
            console.error(`Error creating ${cat.name_en}:`, error)
        } else {
            createdCategories.push(data)
        }
    }

    if (createdCategories.length === 0) {
        console.log("No categories created. Exiting.")
        return
    }

    const salads = createdCategories.find(c => c.name_en === "Salads")
    const soups = createdCategories.find(c => c.name_en === "Soups")
    const desserts = createdCategories.find(c => c.name_en === "Desserts")

    const baseImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" // Generic food image

    const productsData = [
        // Salads (3)
        {
            category_id: salads?.id,
            name_en: "Caesar Salad", name_ru: "Цезарь", name_kz: "Цезарь",
            description_en: "Fresh romaine lettuce with croutons.", description_ru: "Свежий салат ромен с сухариками.", description_kz: "Кытырлак нан косылган жас ромэн салаты.",
            price: 2500, image_url: baseImage
        },
        {
            category_id: salads?.id,
            name_en: "Greek Salad", name_ru: "Греческий", name_kz: "Грек салаты",
            description_en: "Tomatoes, cucumbers, onion, feta cheese.", description_ru: "Помидоры, огурцы, лук, фета.", description_kz: "Кызанак, кияр, пияз, фета.",
            price: 2200, image_url: baseImage
        },
        {
            category_id: salads?.id,
            name_en: "Fresh Salad", name_ru: "Свежий салат", name_kz: "Жас салат",
            description_en: "Mix of seasonal vegetables.", description_ru: "Микс сезонных овощей.", description_kz: "Маусымдык кокконистер коспасы.",
            price: 1800, image_url: baseImage
        },
        // Soups (3)
        {
            category_id: soups?.id,
            name_en: "Lentil Soup", name_ru: "Чечевичный суп", name_kz: "Жасымык сорпасы",
            description_en: "Traditional lentil soup.", description_ru: "Традиционный чечевичный суп.", description_kz: "Дястурли жасымык сорпасы.",
            price: 1500, image_url: baseImage
        },
        {
            category_id: soups?.id,
            name_en: "Chicken Noodle", name_ru: "Куриная лапша", name_kz: "Тауык кеспеси",
            description_en: "Homemade noodles with chicken broth.", description_ru: "Домашняя лапша на курином бульоне.", description_kz: "Тауык сорпасындагы уй кеспеси.",
            price: 1800, image_url: baseImage
        },
        {
            category_id: soups?.id,
            name_en: "Borsch", name_ru: "Борщ", name_kz: "Борщ",
            description_en: "Red beet soup with sour cream.", description_ru: "Свекольный суп со сметаной.", description_kz: "Каймак косылган кызылша сорпасы.",
            price: 2100, image_url: baseImage
        },
        // Desserts (4)
        {
            category_id: desserts?.id,
            name_en: "Cheesecake", name_ru: "Чизкейк", name_kz: "Чизкейк",
            description_en: "New York style cheesecake.", description_ru: "Чизкейк Нью-Йорк.", description_kz: "Нью-Йорк стилиндеги чизкейк.",
            price: 3000, image_url: baseImage
        },
        {
            category_id: desserts?.id,
            name_en: "Chocolate Cake", name_ru: "Шоколадный торт", name_kz: "Шоколад торты",
            description_en: "Rich chocolate layer cake.", description_ru: "Насыщенный шоколадный торт.", description_kz: "Каныккан шоколад торты.",
            price: 2800, image_url: baseImage
        },
        {
            category_id: desserts?.id,
            name_en: "Ice Cream", name_ru: "Мороженое", name_kz: "Балмуздак",
            description_en: "Vanilla ice cream scoops.", description_ru: "Шарики ванильного мороженого.", description_kz: "Ванильди балмуздак шарлары.",
            price: 1200, image_url: baseImage
        },
        {
            category_id: desserts?.id,
            name_en: "Tiramisu", name_ru: "Тирамису", name_kz: "Тирамису",
            description_en: "Italian coffee dessert.", description_ru: "Итальянский кофейный десерт.", description_kz: "Италиялык кофе десерти.",
            price: 3200, image_url: baseImage
        },
    ]

    for (const prod of productsData) {
        if (!prod.category_id) continue;
        console.log(`Creating product ${prod.name_en}...`)
        const { error } = await supabase.from('products').insert({
            ...prod,
            is_available: true,
            options: [] // Empty options
        })
        if (error) {
            console.error(`Error creating ${prod.name_en}:`, error)
        }
    }

    console.log("Seeding complete.")
}

seed()
