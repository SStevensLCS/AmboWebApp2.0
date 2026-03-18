import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isConnected, disconnect } from "@/lib/googleCalendar";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@ambo/database/admin-client";

/**
 * Authenticate via cookie session (web) or Bearer token (mobile).
 * Returns true if the user is admin/superadmin, false otherwise.
 */
async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
    // Try cookie-based session first (web)
    try {
        const session = await getSession();
        if (session && (session.role === "admin" || session.role === "superadmin")) {
            return true;
        }
    } catch {
        // cookies() may throw in non-cookie contexts
    }

    // Try Bearer token (mobile)
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return false;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !supabaseServiceKey) return false;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return false;

    const adminClient = createAdminClient();
    const { data: dbUser } = await adminClient
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single();

    return !!dbUser && (dbUser.role === "admin" || dbUser.role === "superadmin");
}

/**
 * GET /api/auth/google/status
 * Returns whether Google Calendar is connected (org-wide admin calendar).
 * Supports both cookie session (web) and Bearer token (mobile).
 */
export async function GET(req: NextRequest) {
    if (!(await isAuthorizedAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ connected: await isConnected() });
}

/**
 * DELETE /api/auth/google/status
 * Disconnects Google Calendar by removing stored tokens.
 * Supports both cookie session (web) and Bearer token (mobile).
 */
export async function DELETE(req: NextRequest) {
    if (!(await isAuthorizedAdmin(req))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await disconnect();
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
