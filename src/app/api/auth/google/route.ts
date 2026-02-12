import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getAuthUrl } from "@/lib/googleCalendar";

/**
 * GET /api/auth/google
 * Redirects admin to Google OAuth consent screen.
 */
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = getAuthUrl();
    return NextResponse.redirect(url);
}
