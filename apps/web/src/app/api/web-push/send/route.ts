import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendNotificationToUser } from "@/lib/notifications";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || session.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, title, body, url } = await req.json();

    if (!userId || !title) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sendNotificationToUser(userId, { title, body, url });

    return NextResponse.json({ ok: true });
}
