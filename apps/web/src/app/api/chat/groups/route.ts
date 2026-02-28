import { getSession } from "@/lib/session";
import { adminClient } from "@ambo/database/admin-client";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch groups the current user participates in
        const { data: participations, error: partError } = await adminClient
            .from("chat_participants")
            .select("group_id")
            .eq("user_id", session.userId);

        if (partError) {
            return NextResponse.json({ error: partError.message }, { status: 500 });
        }

        const groupIds = (participations || []).map(p => p.group_id);

        if (groupIds.length === 0) {
            return NextResponse.json({ groups: [] });
        }

        const { data: groups, error: groupsError } = await adminClient
            .from("chat_groups")
            .select(`
                *,
                participants:chat_participants(
                    user:users(id, first_name, last_name, email)
                )
            `)
            .in("id", groupIds)
            .order("updated_at", { ascending: false });

        if (groupsError) {
            return NextResponse.json({ error: groupsError.message }, { status: 500 });
        }

        return NextResponse.json({ groups: groups || [] });
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

        const { name, participants } = await req.json();

        if (!Array.isArray(participants) || participants.length === 0) {
            return NextResponse.json(
                { error: "Participants must be a non-empty array" },
                { status: 400 }
            );
        }

        // 1. Create Group
        // Use adminClient to bypass RLS since auth is verified via custom JWT session above
        const { data: group, error: groupError } = await adminClient
            .from("chat_groups")
            .insert({
                name: name || null, // Allow unnamed groups (e.g. 1:1 DMs)
                created_by: session.userId,
            })
            .select()
            .single();

        if (groupError) {
            console.error("Error creating group:", groupError);
            return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
        }

        // 2. Add Participants (Creators + Invited)
        // Ensure creator is included and no duplicates
        const uniqueParticipants = Array.from(new Set([...participants, session.userId]));
        const participantsData = uniqueParticipants.map((userId) => ({
            group_id: group.id,
            user_id: userId,
        }));

        const { error: partError } = await adminClient
            .from("chat_participants")
            .insert(participantsData);

        if (partError) {
            console.error("Error adding participants:", partError);
            // In a real app, we might want to rollback the group creation here
            return NextResponse.json(
                { error: "Group created but failed to add participants" },
                { status: 500 }
            );
        }

        return NextResponse.json({ group });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
