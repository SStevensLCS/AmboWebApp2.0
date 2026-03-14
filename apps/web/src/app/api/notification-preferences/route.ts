import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { NextResponse } from "next/server";

const DEFAULTS = {
    chat_messages: true,
    new_posts: true,
    post_comments: true,
    events: true,
    event_comments: true,
};

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Try to fetch existing preferences first
    const { data: existing } = await supabase
        .from("notification_preferences")
        .select("chat_messages, new_posts, post_comments, events, event_comments")
        .eq("user_id", session.userId)
        .single();

    if (existing) {
        return NextResponse.json({ preferences: existing });
    }

    // No row exists — insert defaults
    const { data: inserted, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: session.userId, ...DEFAULTS })
        .select("chat_messages, new_posts, post_comments, events, event_comments")
        .single();

    if (insertError) {
        // Race condition: row was created between select and insert — just fetch it
        const { data: retry, error: retryError } = await supabase
            .from("notification_preferences")
            .select("chat_messages, new_posts, post_comments, events, event_comments")
            .eq("user_id", session.userId)
            .single();

        if (retryError || !retry) {
            return NextResponse.json({ error: "Failed to load preferences" }, { status: 500 });
        }
        return NextResponse.json({ preferences: retry });
    }

    return NextResponse.json({ preferences: inserted });
}

export async function PUT(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const supabase = createAdminClient();

    // Only allow known preference keys
    const allowed = ["chat_messages", "new_posts", "post_comments", "events", "event_comments"];
    const updates: Record<string, boolean> = {};
    for (const key of allowed) {
        if (typeof body[key] === "boolean") {
            updates[key] = body[key];
        }
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No valid preferences provided" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("notification_preferences")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", session.userId)
        .select("chat_messages, new_posts, post_comments, events, event_comments")
        .single();

    if (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
}
