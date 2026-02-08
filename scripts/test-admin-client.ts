
import { createAdminClient } from '../lib/supabase-admin';
import fs from 'fs';
import path from 'path';

// Manual env loading for script execution
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

async function testAdmin() {
    console.log("Testing Admin Client...");
    const supabase = createAdminClient();

    // Try to list users (requires admin privileges)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error.message);
        process.exit(1);
    }

    console.log(`Success! Found ${users.length} users.`);
    process.exit(0);
}

testAdmin();
