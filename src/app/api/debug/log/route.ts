
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { level, message, data } = body;

        const supabase = createAdminClient();

        await supabase
            .from("debug_logs")
            .insert({
                level: level || "info",
                message: message || "No message",
                data: data || {},
            });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to log:", error);
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}
