import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await req.json();
    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    // Log attempt
    const supabase = createAdminClient();
    await supabase.from("debug_logs").insert({
        level: "info",
        message: "API: Subscription sync request received",
        data: { userId: session.userId, endpointSummary: subscription.endpoint?.substring(0, 20) },
    });

    const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: session.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
    }, { onConflict: "endpoint" });

    if (error) {
        await supabase.from("debug_logs").insert({
            level: "error",
            message: "API: Failed to upsert subscription",
            data: { error: error.message },
        });
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from("debug_logs").insert({
        level: "info",
        message: "API: Subscription synced successfully",
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await req.json();
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", session.userId)
        .eq("endpoint", endpoint);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
}
