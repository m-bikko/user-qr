
import { createClient } from '@supabase/supabase-js'

// Env vars will be passed via command line
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

type ProductOption = {
    name: string
    type: "single" | "multiple"
    choices: { name: string; price: number }[]
    id?: string
}

type ProductSeed = {
    name_en: string
    name_ru: string
    name_kz: string
    price: number
    options?: ProductOption[]
}

type CategorySeed = {
    name_en: string
    name_ru: string
    name_kz: string
    image: string
    products: ProductSeed[]
}

const CATEGORIES: CategorySeed[] = [
    {
        name_en: 'Burgers',
        name_ru: 'Бургеры',
        name_kz: 'Бургерлер',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60',
        products: [
            { name_en: 'Cheeseburger', name_ru: 'Чизбургер', name_kz: 'Чизбургер', price: 1500 },
            { name_en: 'Double Burger', name_ru: 'Двойной Бургер', name_kz: 'Екі еселенген Бургер', price: 2500 },
            { name_en: 'Chicken Burger', name_ru: 'Куриный Бургер', name_kz: 'Тауық Бургері', price: 1400 },
            { name_en: 'Spicy Burger', name_ru: 'Острый Бургер', name_kz: 'Ащы Бургер', price: 1800 },
        ]
    },
    {
        name_en: 'Pizza',
        name_ru: 'Пицца',
        name_kz: 'Пицца',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=60',
        products: [
            { name_en: 'Margherita', name_ru: 'Маргарита', name_kz: 'Маргарита', price: 2000 },
            { name_en: 'Pepperoni', name_ru: 'Пепперони', name_kz: 'Пепперони', price: 2400 },
            { name_en: 'Four Cheese', name_ru: 'Четыре Сыра', name_kz: 'Төрт Ірімшік', price: 2600 },
            { name_en: 'Veggie', name_ru: 'Вегетарианская', name_kz: 'Вегетариандық', price: 2200 },
        ]
    },
    {
        name_en: 'Sushi',
        name_ru: 'Суши',
        name_kz: 'Суши',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60',
        products: [
            { name_en: 'California Roll', name_ru: 'Калифорния', name_kz: 'Калифорния', price: 1800 },
            { name_en: 'Philadelphia Roll', name_ru: 'Филадельфия', name_kz: 'Филадельфия', price: 2200 },
            { name_en: 'Spicy Tuna', name_ru: 'Острый Тунец', name_kz: 'Ащы Тунец', price: 1900 },
            { name_en: 'Dragon Roll', name_ru: 'Дракон', name_kz: 'Айдаһар', price: 2800 },
        ]
    },
    {
        name_en: 'Drinks',
        name_ru: 'Напитки',
        name_kz: 'Сусындар',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=500&q=60',
        products: [
            { name_en: 'Cola', name_ru: 'Кола', name_kz: 'Кола', price: 500 },
            { name_en: 'Lemonade', name_ru: 'Лимонад', name_kz: 'Лимонад', price: 800 },
            { name_en: 'Ice Tea', name_ru: 'Холодный Чай', name_kz: 'Салқын Шай', price: 600 },
            { name_en: 'Water', name_ru: 'Вода', name_kz: 'Су', price: 300 },
        ]
    },
    {
        name_en: 'Desserts',
        name_ru: 'Десерты',
        name_kz: 'Тәттілер',
        // New working image for desserts/cakes (Tiramisu)
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=60',
        products: [
            { name_en: 'Cheesecake', name_ru: 'Чизкейк', name_kz: 'Чизкейк', price: 1200 },
            { name_en: 'Chocolate Cake', name_ru: 'Шоколадный Торт', name_kz: 'Шоколад Торты', price: 1300 },
            { name_en: 'Ice Cream', name_ru: 'Мороженое', name_kz: 'Балмұздақ', price: 800 },
            { name_en: 'Tiramisu', name_ru: 'Тирамису', name_kz: 'Тирамису', price: 1500 },
        ]
    }
]

async function main() {
    console.log('Searching for "kulsary" restaurant...')

    // Find restaurant
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id, name')
        .ilike('name', '%kulsary%')
        .limit(1)

    if (rError || !restaurants || restaurants.length === 0) {
        console.log('Could not find specific "kulsary" restaurant. Searching for ANY restaurant...')
        const { data: anyRest, error: anyError } = await supabase
            .from('restaurants')
            .select('id, name')
            .limit(1)

        if (anyError || !anyRest || anyRest.length === 0) {
            console.error('No restaurants found at all. Please create one first.')
            return
        }
        console.log(`Found fallback restaurant: ${anyRest[0].name} (${anyRest[0].id})`)
        return seed(anyRest[0].id)
    }

    console.log(`Found restaurant: ${restaurants[0].name} (${restaurants[0].id})`)
    await seed(restaurants[0].id)
}

async function seed(restaurantId: string) {
    console.log(`Seeding data for restaurant_id: ${restaurantId}`)

    // Cleanup existing data for this restaurant to avoid duplicates
    console.log("Cleaning up existing categories and products...")
    const { error: delError } = await supabase.from('categories').delete().eq('restaurant_id', restaurantId)
    if (delError) console.error("Error cleaning up:", delError.message)

    for (const [index, cat] of CATEGORIES.entries()) {
        console.log(`Creating category: ${cat.name_en}`)

        // Create Category
        // Categories table does NOT have image_url based on types.ts, so ignoring it for category row.
        const { data: categoryData, error: cError } = await supabase
            .from('categories')
            .insert({
                restaurant_id: restaurantId,
                name_en: cat.name_en,
                name_ru: cat.name_ru,
                name_kz: cat.name_kz,
                sort_order: index
            })
            .select()
            .single()

        if (cError) {
            console.error(`Error creating category ${cat.name_en}:`, cError.message)
            continue
        }

        const categoryId = categoryData.id

        // Create Products
        const productsPayload = cat.products.map(p => ({
            restaurant_id: restaurantId,
            category_id: categoryId,
            name_en: p.name_en,
            name_ru: p.name_ru,
            name_kz: p.name_kz,
            description_en: `Delicious ${p.name_en}`,
            description_ru: `Вкусный ${p.name_ru}`,
            description_kz: `Дәмді ${p.name_kz}`,
            price: p.price,
            image_url: cat.image,
            is_available: true,
            options: p.options ? p.options : []
        }))

        const { error: pError } = await supabase
            .from('products')
            .insert(productsPayload)

        if (pError) {
            console.error(`Error creating products for ${cat.name_en}:`, pError.message)
        } else {
            console.log(`Created ${productsPayload.length} products for ${cat.name_en}`)
        }
    }
    console.log('Seeding complete!')
}

main().catch(console.error)
