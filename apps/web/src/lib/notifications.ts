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

export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    mobilePath?: string;
};

/**
 * Send Expo push notifications to mobile devices.
 * Uses the Expo Push API to deliver to native tokens.
 */
async function sendExpoNotifications(
    tokens: string[],
    payload: PushPayload
) {
    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
        to: token,
        title: payload.title,
        body: payload.body,
        data: {
            url: payload.url,
            mobilePath: payload.mobilePath,
        },
        sound: "default" as const,
    }));

    try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(messages),
        });

        if (!response.ok) {
            console.error(
                "[Push/Expo] API error:",
                response.status,
                await response.text()
            );
        }
    } catch (err) {
        console.error("[Push/Expo] Failed to send:", err);
    }
}

/**
 * Send mobile push notifications to a specific user's devices.
 */
async function sendMobileNotificationsToUser(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    payload: PushPayload
) {
    const { data: mobileTokens } = await supabase
        .from("mobile_push_tokens")
        .select("token")
        .eq("user_id", userId);

    if (mobileTokens && mobileTokens.length > 0) {
        await sendExpoNotifications(
            mobileTokens.map((t) => t.token),
            payload
        );
    }
}

/**
 * Send a push notification to a specific user.
 */
export async function sendNotificationToUser(
    userId: string,
    payload: PushPayload
) {
    const supabase = createAdminClient();

    // 1. Web push subscriptions
    const { data: subscriptions, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (!error && subscriptions && subscriptions.length > 0) {
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

                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(
                        `[Push] Deleting expired subscription ${sub.id}`
                    );
                    await supabase
                        .from("push_subscriptions")
                        .delete()
                        .eq("id", sub.id);
                }
            }
        });

        await Promise.all(promises);
    } else {
        console.log(`[Push] No web subscriptions found for user ${userId}`);
    }

    // 2. Mobile push tokens (Expo)
    await sendMobileNotificationsToUser(supabase, userId, payload);
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
    const targetUserIds = excludeUserId
        ? userIds.filter((id) => id !== excludeUserId)
        : userIds;

    // 2. Web push: Fetch subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", targetUserIds);

    if (subError) {
        await supabase.from("debug_logs").insert({
            level: "error",
            message: "Failed to fetch subscriptions",
            data: { error: subError },
        });
    }

    if (subscriptions && subscriptions.length > 0) {
        // Log attempt
        await supabase.from("debug_logs").insert({
            level: "info",
            message: `Attempting to send to ${subscriptions.length} web subscriptions`,
            data: { role, excludeUserId, payload },
        });

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
                await webpush.sendNotification(
                    pushSubscription,
                    payloadString
                );
                await supabase.from("debug_logs").insert({
                    level: "info",
                    message: "Push sent successfully",
                    data: {
                        endpoint: sub.endpoint,
                        userId: sub.user_id,
                    },
                });
            } catch (err: any) {
                await supabase.from("debug_logs").insert({
                    level: "error",
                    message: "Push failed",
                    data: {
                        endpoint: sub.endpoint,
                        error: err.toString(),
                        statusCode: err.statusCode,
                    },
                });

                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabase
                        .from("push_subscriptions")
                        .delete()
                        .eq("id", sub.id);
                }
            }
        });

        await Promise.all(promises);
    }

    // 3. Mobile push tokens (Expo)
    const { data: mobileTokens } = await supabase
        .from("mobile_push_tokens")
        .select("token")
        .in("user_id", targetUserIds);

    if (mobileTokens && mobileTokens.length > 0) {
        await sendExpoNotifications(
            mobileTokens.map((t) => t.token),
            payload
        );
    }
}
