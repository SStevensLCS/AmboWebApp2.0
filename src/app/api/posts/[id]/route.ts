import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check ownership or admin
    const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", params.id)
        .single();

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== session.userId && session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("posts").delete().eq("id", params.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content?.trim()) {
        return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check ownership (only author can edit, maybe admin too but usually just author)
    const { data: post } = await supabase
        .from("posts")
        .select("user_id")
        .eq("id", params.id)
        .single();

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.user_id !== session.userId && session.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("posts")
        .update({ content: content.trim() })
        .eq("id", params.id)
        .select("*, users(first_name, last_name)")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ post: data });
}
