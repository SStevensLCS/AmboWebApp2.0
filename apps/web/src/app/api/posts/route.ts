import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";
import { postSchema, checkContentLength } from "@/lib/validations";
import { parsePagination, buildPaginatedResponse } from "@/lib/pagination";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { page, limit, from, to } = parsePagination(
        new URL(req.url),
        { page: 1, limit: 25 }
    );

    const supabase = createAdminClient();
    const { data, error, count } = await supabase
        .from("posts")
        .select(`
            *,
            users (
                first_name,
                last_name,
                role,
                avatar_url
            ),
            comments (count)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }

    return NextResponse.json(buildPaginatedResponse(data || [], count || 0, { page, limit, from, to }));
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 10 requests per 5 minutes
    const rateLimitResult = checkRateLimit(getRateLimitKey(req, "posts"), {
        maxRequests: 10,
        windowSeconds: 300,
    });
    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: "Too many posts. Please wait before posting again." },
            { status: 429 }
        );
    }

    // Payload size check
    const sizeError = checkContentLength(req);
    if (sizeError) {
        return NextResponse.json({ error: sizeError }, { status: 413 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0].message },
            { status: 400 }
        );
    }

    const { content } = parsed.data;

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("posts")
        .insert({
            user_id: session.userId,
            content,
        })
        .select(`
            *,
            users (
                first_name,
                last_name,
                role,
                avatar_url
            )
        `)
        .single();

    if (error) {
        return NextResponse.json({ error: "Request failed" }, { status: 400 });
    }

    // ── Notify Users ─────────────────────────────────────

    const { sendNotificationToRole } = await import("@/lib/notifications");

    // 1. Always notify Admins (excluding the sender)
    await sendNotificationToRole("admin", {
        title: "New Post from " + data.users.first_name,
        body: content.substring(0, 100),
        url: "/admin/posts",
        mobilePath: "/(admin)/posts",
    }, session.userId);

    // 2. If sender is Admin/Superadmin, ALSO notify Students
    if (["admin", "superadmin"].includes(session.role)) {
        await sendNotificationToRole("student", {
            title: "New Announcement from " + data.users.first_name,
            body: content.substring(0, 100),
            url: "/student/posts",
            mobilePath: "/(student)/posts",
        }, session.userId);
    }

    return NextResponse.json({ post: data });
}
