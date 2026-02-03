
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load .env manually
try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
        console.log('Loading .env from', envPath)
        const envConfig = fs.readFileSync(envPath, 'utf-8')
        envConfig.split(/\r?\n/).forEach(line => {
            // Skip comments and empty lines
            if (!line || line.startsWith('#')) return

            // Split only on first =
            const match = line.match(/^([^=]+)=(.*)$/)
            if (match) {
                const key = match[1].trim()
                let value = match[2].trim()
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                }

                if (!process.env[key]) {
                    process.env[key] = value
                }
            }
        })
    }
} catch (e) {
    console.log('No .env file found or error reading it', e)
}

// Env vars will be passed via command line or loaded above
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Or NEXT_PUBLIC... if using anon for dev (but anon cant update usually)

// Check if we have service key, if not try anon key but warn
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Searching for "kulsary" restaurant...')

    // Find restaurant
    const { data: restaurants, error: rError } = await supabase
        .from('restaurants')
        .select('id, name')
        .ilike('name', '%kulsary%')
        .limit(1)

    if (rError || !restaurants || restaurants.length === 0) {
        console.error('Could not find specific "kulsary" restaurant.')
        return
    }

    const restaurant = restaurants[0]
    console.log(`Found restaurant: ${restaurant.name} (${restaurant.id})`)

    // IMPORTANT: Make sure the ID and structure matches what the frontend expects
    // The frontend expects `ProductOption` structure.
    const defaultOptions = [
        {
            id: crypto.randomUUID(),
            name: "Size", // Размер
            type: "single",
            choices: [
                { name: "S", price: 0 },
                { name: "M", price: 500 },
                { name: "L", price: 1000 }
            ]
        }
    ]

    console.log("Updating all products with default options...")

    // Update all products for this restaurant
    const { error: updateError } = await supabase
        .from('products')
        .update({ options: defaultOptions })
        .eq('restaurant_id', restaurant.id)

    if (updateError) {
        console.error("Error updating products:", updateError.message)
    } else {
        console.log("Successfully added options to all products!")
    }
}

main().catch(console.error)
