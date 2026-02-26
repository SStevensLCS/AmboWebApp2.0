import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { sendNotificationToUser } from "@/lib/notifications";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const groupId = req.nextUrl.searchParams.get("groupId");
        if (!groupId) {
            return NextResponse.json({ error: "groupId is required" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Verify user is a participant
        const { data: participant } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("group_id", groupId)
            .eq("user_id", session.userId)
            .single();

        if (!participant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: messages, error } = await supabase
            .from("chat_messages")
            .select(`
                *,
                sender:users!chat_messages_sender_id_fkey(first_name, last_name, avatar_url)
            `)
            .eq("group_id", groupId)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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

        const supabase = createAdminClient();

        // Verify user is a participant in this group
        const { data: participant } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("group_id", groupId)
            .eq("user_id", session.userId)
            .single();

        if (!participant) {
            return NextResponse.json(
                { error: "You are not a participant in this group" },
                { status: 403 }
            );
        }

        // Insert Message
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
