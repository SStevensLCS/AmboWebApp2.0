import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isStudentConnected, disconnectStudentCalendar } from "@/lib/studentCalendar";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connected = await isStudentConnected(session.userId);
    return NextResponse.json({ connected });
}

export async function DELETE() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await disconnectStudentCalendar(session.userId);
    return NextResponse.json({ connected: false });
}
