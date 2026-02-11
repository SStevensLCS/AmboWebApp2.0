import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = req.nextUrl.searchParams.get("event_id");
    if (!eventId) {
        return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: comments } = await supabase
        .from("event_comments")
        .select("*, users(first_name, last_name)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

    const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("status, user_id, users(first_name, last_name)")
        .eq("event_id", eventId);

    return NextResponse.json({
        comments: comments || [],
        rsvps: rsvps || [],
    });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { event_id, content } = await req.json();
    if (!event_id || !content?.trim()) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("event_comments").insert({
        event_id,
        user_id: session.userId,
        content: content.trim(),
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return updated comments
    const { data } = await supabase
        .from("event_comments")
        .select("*, users(first_name, last_name)")
        .eq("event_id", event_id)
        .order("created_at", { ascending: true });

    return NextResponse.json({ comments: data || [] });
}
