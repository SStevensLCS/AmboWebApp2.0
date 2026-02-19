import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { sendNotificationToUser } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { groupId, content } = await req.json();

        if (!groupId || !content) {
            return NextResponse.json(
                { error: "groupId and content are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Check if user is participant (Implicitly handled by RLS on Insert, but good to check for Notifications)
        // Actually RLS for INSERT chat_messages: "Participants can insert messages".
        // So if insert succeeds, they are a participant.

        // 2. Insert Message
        const { data: message, error } = await supabase
            .from("chat_messages")
            .insert({
                group_id: groupId,
                sender_id: session.userId,
                content: content,
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
        }

        // 3. Send Notifications
        // Fetch all participants to send notifications
        const { data: participants, error: partError } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("group_id", groupId);

        if (!partError && participants) {
            const recipients = participants.filter((p) => p.user_id !== session.userId);

            // We can run this in background or await. 
            // For Vercel/Serverless, better to await or use waitUntil if available, but here await is safer.
            const notificationPromises = recipients.map((recipient) =>
                sendNotificationToUser(recipient.user_id, {
                    title: "New Message",
                    body: content.length > 50 ? `${content.substring(0, 50)}...` : content,
                    url: `/student/chat`, // Or specific chat URL
                })
            );

            Promise.allSettled(notificationPromises).then((results) => {
                // Log errors if any (optional)
            });
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
