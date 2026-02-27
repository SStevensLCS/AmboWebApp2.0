import webpush from "web-push";
import { createAdminClient } from "@ambo/database/admin-client";

// Initialize web-push with VAPID keys
if (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

type PushPayload = {
    title: string;
    body: string;
    url?: string;
};

/**
 * Send a push notification to a specific user.
 */
export async function sendNotificationToUser(
    userId: string,
    payload: PushPayload
) {
    const supabase = createAdminClient();

    // 1. Get user's subscriptions
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (error || !subscriptions || subscriptions.length === 0) {
        console.log(`[Push] No subscriptions found for user ${userId}`);
        return;
    }

    // 2. Send to all endpoints
    const payloadString = JSON.stringify(payload);

    const promises = subscriptions.map(async (sub) => {
        const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
            },
        };

        try {
            await webpush.sendNotification(pushSubscription, payloadString);
        } catch (err: any) {
            console.error(`[Push] Failed to send to ${sub.id}:`, err);

            // If the subscription is invalid/expired (410 Gone), delete it
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`[Push] Deleting expired subscription ${sub.id}`);
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
        }
    });

    await Promise.all(promises);
}

/**
 * Send a push notification to all users with a specific role.
 */
export async function sendNotificationToRole(
    role: "admin" | "student",
    payload: PushPayload,
    excludeUserId?: string
) {
    const supabase = createAdminClient();

    // Log start
    await supabase.from("debug_logs").insert({
        level: "info",
        message: `sendNotificationToRole called for role: ${role}`,
        data: { role, excludeUserId },
    });

    // 1. Get users with role
    let roles: string[] = [role];
    if (role === "admin") {
        roles = ["admin", "superadmin"];
    }

    const { data: users, error: userError } = await supabase
        .from("users")
        .select("id")
        .in("role", roles);

    if (userError || !users || users.length === 0) {
        await supabase.from("debug_logs").insert({
            level: "error",
            message: "Failed to fetch users for role",
            data: { error: userError, roles },
        });
        return;
    }

    const userIds = users.map((u) => u.id);

    // 2. Fetch subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

    if (subError) {
        await supabase.from("debug_logs").insert({
            level: "error",
            message: "Failed to fetch subscriptions",
            data: { error: subError },
        });
        return;
    }

    if (!subscriptions || subscriptions.length === 0) {
        await supabase.from("debug_logs").insert({
            level: "warn",
            message: "No subscriptions found for target users",
            data: { userCount: userIds.length },
        });
        return;
    }

    // Log attempt
    await supabase.from("debug_logs").insert({
        level: "info",
        message: `Attempting to send to ${subscriptions.length} subscriptions`,
        data: { role, excludeUserId, payload },
    });

    const payloadString = JSON.stringify(payload);

    const promises = subscriptions
        .filter((sub) => sub.user_id !== excludeUserId)
        .map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth,
                },
            };

            try {
                await webpush.sendNotification(pushSubscription, payloadString);
                // Log success
                await supabase.from("debug_logs").insert({
                    level: "info",
                    message: "Push sent successfully",
                    data: { endpoint: sub.endpoint, userId: sub.user_id },
                });
            } catch (err: any) {
                // Log error
                await supabase.from("debug_logs").insert({
                    level: "error",
                    message: "Push failed",
                    data: { endpoint: sub.endpoint, error: err.toString(), statusCode: err.statusCode },
                });

                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                }
            }
        });

    await Promise.all(promises);
}
