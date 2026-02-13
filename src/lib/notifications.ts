import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // 1. Get users with role
    // If targeting 'admin', also include 'superadmin'
    let roles: string[] = [role];
    if (role === "admin") {
        roles = ["admin", "superadmin"];
    }

    // Efficiency: query push_subscriptions joined with users
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*, users!inner(role)")
        .in("users.role", roles);

    if (error || !subscriptions) {
        console.error("[Push] Failed to fetch role subscriptions:", error);
        return;
    }

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
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase.from("push_subscriptions").delete().eq("id", sub.id);
                }
            }
        });

    await Promise.all(promises);
}
