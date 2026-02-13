
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing env vars. Please run with .env.local loaded.");
    process.exit(1);
}

function getAdminClient() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function checkSubscriptions(userId: string) {
    console.log(`Checking subscriptions for user: ${userId}`);

    const supabase = getAdminClient();

    // 1. Get user details
    const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

    if (userError) {
        console.error("Error fetching user:", userError.message);
        return;
    }

    console.log("User Found:", user.first_name, user.last_name, user.role);

    // 2. Get subscriptions
    const { data: subs, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (subError) {
        console.error("Error fetching subscriptions:", subError.message);
        return;
    }

    console.log(`Found ${subs?.length} active subscriptions for this user.`);
    if (subs && subs.length > 0) {
        subs.forEach((sub, i) => {
            console.log(`[${i + 1}] Endpoint: ${sub.endpoint.substring(0, 50)}...`);
            console.log(`     Created At: ${sub.created_at}`);
        });
    } else {
        console.warn("⚠️ NO SUBSCRIPTIONS FOUND! This device is not registered for notifications.");
    }
}

// Phone number: 7604848038 -> User ID: 88402e41-d212-4016-8f43-b23b64ed5810
const targetUserId = "88402e41-d212-4016-8f43-b23b64ed5810";
checkSubscriptions(targetUserId);
