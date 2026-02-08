
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env manually
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=')
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join('=').trim()
        }
    })
}

// Env vars will be passed via command line
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminEmail = process.env.ADMIN_EMAIL!
const adminPassword = process.env.ADMIN_PASSWORD!

if (!supabaseUrl || !supabaseServiceKey || !adminEmail || !adminPassword) {
    console.error('Missing Supabase credentials or Admin credentials in .env')
    process.exit(1)
}

// Disable auth persistence to ensure service role is always used for DB ops
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

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
    console.log('--- STARTING RESTORATION ---')

    // 1. Authenticate Admin User (using Admin API, avoiding implicit login)
    let userId: string | null = null

    console.log(`Checking for user: ${adminEmail}...`)

    // Service Role listUsers allows listing all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
        console.error("Error listing users:", listError.message)
        process.exit(1)
    }

    const existingUser = users.find(u => u.email === adminEmail)

    if (existingUser) {
        console.log("User found via Admin API.")
        userId = existingUser.id
    } else {
        console.log("User not found. Creating new user...")
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true
        })

        if (createError) {
            console.error("Error creating user:", createError.message)
            process.exit(1)
        }

        if (createData.user) {
            console.log("User created successfully.")
            userId = createData.user.id
        }
    }

    if (!userId) {
        console.error("No user ID found.")
        process.exit(1)
    }

    console.log(`User ID: ${userId}`)

    // 2. Create Restaurant
    console.log("Creating Restaurant...")
    // Using service role client, RLS should be bypassed
    const { data: restaurant, error: rError } = await supabase
        .from('restaurants')
        .insert({
            name: 'Kulsary-Restaurant',
            slug: 'kulsary-restaurant', // Explicit slug
            theme: 'default'
        })
        .select()
        .single()

    let restaurantId: string | null = null

    if (rError) {
        console.error("Error creating restaurant:", rError.message)
        // Maybe it exists? try fetching
        const { data: existing } = await supabase.from('restaurants').select().eq('slug', 'kulsary-restaurant').single()
        if (existing) {
            console.log("Restaurant already exists (maybe partially deleted?), using it.")
            restaurantId = existing.id
        } else {
            process.exit(1)
        }
    } else {
        restaurantId = restaurant.id
    }

    if (!restaurantId) {
        console.error("Failed to secure restaurant ID.")
        process.exit(1)
    }

    console.log(`Restaurant ID: ${restaurantId}`)


    // 3. Link Profile
    console.log("Linking User Profile...")
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            restaurant_id: restaurantId,
            role: 'restaurant_admin'
        })

    if (profileError) {
        console.error("Error updating profile:", profileError.message)
    } else {
        console.log("Profile updated successfully.")
    }

    // 4. Create Kitchen
    console.log("Creating Main Kitchen...")
    const { data: kitchen, error: kError } = await supabase
        .from('kitchens')
        .insert({
            restaurant_id: restaurantId,
            name_en: 'Main Kitchen',
            name_ru: 'Главная Кухня',
            name_kz: 'Негізгі Асхана',
            is_available: true,
            sort_order: 0
        })
        .select()
        .single()

    let kitchenId = kitchen?.id
    if (kError) {
        console.error("Error creating kitchen:", kError.message)
        // Try fetch
        const { data: ek } = await supabase.from('kitchens').select().eq('restaurant_id', restaurantId).limit(1).single()
        if (ek) kitchenId = ek.id
    }

    if (!kitchenId) {
        console.error("No kitchen ID. Categories might fail assignment.")
    }


    // 5. Seed Menu (Categories & Products)
    console.log("Seeding Menus...")
    for (const [index, cat] of CATEGORIES.entries()) {
        console.log(`Creating category: ${cat.name_en}`)

        const { data: categoryData, error: cError } = await supabase
            .from('categories')
            .insert({
                restaurant_id: restaurantId,
                kitchen_id: kitchenId || null, // Assign to kitchen
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

    console.log('--- RESTORATION COMPLETE ---')
}

main().catch(console.error)
