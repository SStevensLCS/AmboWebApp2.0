import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { exchangeStudentCode } from "@/lib/studentCalendar";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "student") {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    if (!code) {
        return NextResponse.redirect(
            new URL("/student/profile?error=missing_code", req.url)
        );
    }

    // Verify state matches the logged-in user to prevent token theft
    if (state !== session.userId) {
        return NextResponse.redirect(
            new URL("/student/profile?error=state_mismatch", req.url)
        );
    }

    try {
        await exchangeStudentCode(code, session.userId);
        return NextResponse.redirect(
            new URL("/student/profile?gcal=connected", req.url)
        );
    } catch (err) {
        console.error("[StudentGCal] Token exchange failed:", err);
        return NextResponse.redirect(
            new URL("/student/profile?error=gcal_auth_failed", req.url)
        );
    }
}
