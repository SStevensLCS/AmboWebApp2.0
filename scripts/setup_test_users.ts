import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_USERS = [
  {
    email: "admin_test@ambo.local",
    password: "Testing123!",
    role: "admin",
    firstName: "Test",
    lastName: "Admin",
    phone: "5550000001",
  },
  {
    email: "student_test@ambo.local",
    password: "Testing123!",
    role: "student",
    firstName: "Test",
    lastName: "Student",
    phone: "5550000002",
  },
  {
    email: "applicant_test@ambo.local",
    password: "Testing123!",
    role: "applicant",
    firstName: "Test",
    lastName: "Applicant",
    phone: "5550000003",
  },
];

async function setupTestUsers() {
  console.log("Setting up test users...");

  for (const user of TEST_USERS) {
    console.log(`Processing ${user.email}...`);

    // 1. Check/Create Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error("Error listing users:", listError);
        continue;
    }

    let authUser = users.find((u) => u.email === user.email);

    if (!authUser) {
      console.log(`Creating auth user for ${user.email}...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        console.error(`Failed to create auth user ${user.email}:`, error.message);
        continue;
      }
      authUser = data.user;
    } else {
      console.log(`Auth user ${user.email} already exists.`);
      // Optional: Update password to ensure we know it
      await supabase.auth.admin.updateUserById(authUser.id, { password: user.password });
    }

    if (!authUser) {
        console.error(`Could not get auth user for ${user.email}`);
        continue;
    }

    // 2. Upsert Public Profile
    console.log(`Upserting public profile for ${user.email} (${authUser.id})...`);
    
    const { error: profileError } = await supabase.from("users").upsert({
      id: authUser.id,
      email: user.email,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
    });

    if (profileError) {
      console.error(`Failed to upsert profile for ${user.email}:`, profileError.message);
    } else {
      console.log(`Successfully setup ${user.email} as ${user.role}.`);
    }
  }

  console.log("Test user setup complete.");
}

setupTestUsers();
