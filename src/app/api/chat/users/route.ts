import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();
        let query = supabase.from("users").select("id, first_name, last_name, role, email, avatar_url");

        if (session.role === "student") {
            // Students can only see admins and superadmins
            query = query.in("role", ["admin", "superadmin"]);
        } else if (session.role === "applicant") {
            // Applicants can only see admins and superadmins (assuming similar to student)
            query = query.in("role", ["admin", "superadmin"]);
        }
        // Admins and Superadmins see everyone

        const { data: users, error } = await query;

        if (error) {
            console.error("Error fetching users:", error);
            return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
        }

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
