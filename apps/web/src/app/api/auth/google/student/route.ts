import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getStudentAuthUrl } from "@/lib/studentCalendar";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = getStudentAuthUrl(session.userId);
    return NextResponse.redirect(url);
}
