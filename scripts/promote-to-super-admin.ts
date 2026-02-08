
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminEmail = process.env.ADMIN_EMAIL!

if (!supabaseUrl || !supabaseServiceKey || !adminEmail) {
    console.error('Missing credentials')
    process.exit(1)
}

// Service role client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function main() {
    console.log(`Promoting ${adminEmail} to SUPER ADMIN...`)

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
        console.error("Error listing users:", listError.message)
        process.exit(1)
    }

    const user = users.find(u => u.email === adminEmail)
    if (!user) {
        console.error("User not found!")
        process.exit(1)
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id)

    if (updateError) {
        console.error("Error updating profile:", updateError.message)
    } else {
        console.log(`Success! User ${adminEmail} is now a SUPER ADMIN.`)
        // Verify
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        console.log("Current Role:", data?.role)
    }
}

main()
