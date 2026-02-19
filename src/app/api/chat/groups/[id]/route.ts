import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = params;
        const { name, addParticipants, removeParticipants } = await req.json();
        const supabase = await createClient();

        // Verify user is a participant or admin
        // RLS will handle the update on chat_groups if configured correctly, 
        // but for participant management we might need explicit checks or admin client.

        // Check membership
        const { data: membership, error: memberError } = await supabase
            .from("chat_participants")
            .select("group_id")
            .eq("group_id", id)
            .eq("user_id", session.userId)
            .single();

        if (memberError || !membership) {
            // Allow admins to update even if not participant? 
            // For now, let's enforce "Must be participant" or "Superadmin".
            if (session.role !== 'superadmin' && session.role !== 'admin') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        // 1. Update Name
        if (name !== undefined) {
            const { error: updateError } = await supabase
                .from("chat_groups")
                .update({ name })
                .eq("id", id);

            if (updateError) {
                return NextResponse.json({ error: "Failed to update group name" }, { status: 500 });
            }
        }

        // 2. Add Participants
        if (Array.isArray(addParticipants) && addParticipants.length > 0) {
            const participantsData = addParticipants.map((userId) => ({
                group_id: id,
                user_id: userId,
            }));

            // Use standard client if RLS allows, otherwise admin. 
            // We added "Users can add participants" RLS, so try standard.
            const { error: addError } = await supabase
                .from("chat_participants")
                .insert(participantsData);

            if (addError) {
                console.error("Error adding participants:", addError);
                return NextResponse.json({ error: "Failed to add participants" }, { status: 500 });
            }
        }

        // 3. Remove Participants
        if (Array.isArray(removeParticipants) && removeParticipants.length > 0) {
            // Use Admin Client because we didn't add DELETE policy for participants
            const adminSupabase = createAdminClient();

            const { error: removeError } = await adminSupabase
                .from("chat_participants")
                .delete()
                .eq("group_id", id)
                .in("user_id", removeParticipants);

            if (removeError) {
                console.error("Error removing participants:", removeError);
                return NextResponse.json({ error: "Failed to remove participants" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
