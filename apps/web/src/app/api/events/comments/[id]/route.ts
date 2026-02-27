import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: comment } = await supabase
        .from("event_comments")
        .select("user_id")
        .eq("id", params.id)
        .single();

    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== session.userId && (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("event_comments").delete().eq("id", params.id);

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

    const supabase = createAdminClient();
    const { data: comment } = await supabase
        .from("event_comments")
        .select("user_id")
        .eq("id", params.id)
        .single();

    if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== session.userId && (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
        .from("event_comments")
        .update({ content: content.trim() })
        .eq("id", params.id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comment: data });
}
