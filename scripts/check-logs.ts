
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local'); // path relative to script folder

try {
    console.log("Loading env from:", envPath);
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};

    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > -1) {
            const key = trimmed.substring(0, equalsIndex).trim();
            let value = trimmed.substring(equalsIndex + 1).trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("Parsed URL:", url ? `${url.substring(0, 5)}...` : "undefined");
    console.log("Parsed Key:", key ? `${key.substring(0, 5)}...` : "undefined");
    console.log("Keys found in env:", Object.keys(env));

    if (!url || !key) {
        console.error("Missing env vars. Keys found:", Object.keys(env));
        process.exit(1);
    }

    checkLogs(url, key);

} catch (err) {
    console.error("Failed to read .env.local:", err.message);
    process.exit(1);
}

// 2. Query logs
async function checkLogs(url, key) {
    console.log("Connecting to Supabase...");
    console.log("Debug URL:", JSON.stringify(url));
    console.log("Debug Key:", JSON.stringify(key));
    console.log("Type of URL:", typeof url);

    try {
        const supabase = createClient(url, key);

        const { data: logs, error } = await supabase
            .from('debug_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error fetching logs:", error);
            return;
        }

        console.log(`Found ${logs.length} logs.`);
        if (logs.length === 0) {
            console.log("No logs found. The Service Worker might not be running or failed to send logs.");
        }

        logs.forEach(log => {
            console.log(`[${log.created_at}] [${log.level}] ${log.message}`);
            if (log.data && Object.keys(log.data).length > 0) {
                console.log("   Data:", JSON.stringify(log.data, null, 2));
            }
            console.log("-".repeat(50));
        });
    }

checkLogs();
