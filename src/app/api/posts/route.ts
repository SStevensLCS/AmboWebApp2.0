import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("posts")
        .select(`
            *,
            users (
                first_name,
                last_name
            ),
            comments (count)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ posts: data || [] });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
        return NextResponse.json(
            { error: "Content is required" },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("posts")
        .insert({
            user_id: session.userId,
            content: content.trim(),
        })
        .select(`
            *,
            users (
                first_name,
                last_name
            )
        `)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ── Notify Users ─────────────────────────────────────
    // If student posts -> Notify Admins
    // If admin posts -> Notify Students (if it's important?)
    // For now, let's notify Admins of all new posts.

    if (session.role === "student") {
        const { sendNotificationToRole } = await import("@/lib/notifications");
        await sendNotificationToRole("admin", {
            title: "New Post from " + data.users.first_name,
            body: content.substring(0, 100),
            url: "/admin/posts",
        });
    }

    return NextResponse.json({ post: data });
}
