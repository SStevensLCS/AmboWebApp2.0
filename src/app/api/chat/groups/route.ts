import { getSession } from "@/lib/session";
import { adminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

        // Student validation: Must include at least one admin
        if (session.role === "student" || session.role === "applicant") {
            const { data: users, error: userError } = await adminClient
                .from("users")
                .select("role")
                .in("id", participants);

            if (userError) {
                return NextResponse.json({ error: "Failed to validate participants" }, { status: 500 });
            }

            const hasAdmin = users.some(
                (u) => u.role === "admin" || u.role === "superadmin"
            );

            if (!hasAdmin) {
                return NextResponse.json(
                    { error: "Students must include at least one admin in the chat" },
                    { status: 403 }
                );
            }
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
