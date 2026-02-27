import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isConnected } from "@/lib/googleCalendar";

/**
 * GET /api/auth/google/status
 * Returns whether Google Calendar is connected.
 */
export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ connected: await isConnected() });
}
