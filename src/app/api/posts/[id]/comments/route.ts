import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("comments")
        .select(`
            *,
            users (
                first_name,
                last_name
            )
        `)
        .eq("post_id", params.id)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ comments: data || [] });
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
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
        .from("comments")
        .insert({
            post_id: params.id,
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

    // ── Notify Post Author ───────────────────────────────
    // Get the post author
    const { data: post, error: postError } = await supabase
        .from("posts")
        .select("user_id, title")
        .eq("id", params.id)
        .single();

    if (!postError && post && post.user_id !== session.userId) {
        const { sendNotificationToUser } = await import("@/lib/notifications");
        await sendNotificationToUser(post.user_id, {
            title: "New Comment on: " + post.title,
            body: data.users.first_name + ": " + content.substring(0, 50),
            url: "/student/posts", // Or specific post URL if we have a detailed view
        });
    }

    return NextResponse.json({ comment: data });
}
