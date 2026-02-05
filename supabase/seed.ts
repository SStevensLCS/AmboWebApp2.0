/**
 * Seed script: ensures user with phone 7604848038 exists with role 'admin'.
 * Run with: npx tsx supabase/seed.ts
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seed() {
  const { data: existing } = await supabase
    .from("users")
    .select("id, role")
    .eq("phone", "7604848038")
    .single();

  if (existing) {
    await supabase.from("users").update({ role: "admin" }).eq("id", existing.id);
    console.log("Updated existing user 7604848038 to admin.");
  } else {
    const { error } = await supabase.from("users").insert({
      first_name: "Super",
      last_name: "Admin",
      phone: "7604848038",
      email: "admin@ambo.local",
      role: "admin",
    });
    if (error) {
      console.error("Seed failed:", error.message);
      process.exit(1);
    }
    console.log("Created admin user with phone 7604848038.");
  }
}

seed();
