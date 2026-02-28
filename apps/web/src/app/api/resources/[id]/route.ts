import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Get resource first to find file path
    const { data: resource } = await supabase
        .from("resources")
        .select("file_url")
        .eq("id", params.id)
        .single();

    if (!resource) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Delete from DB
    const { error: dbError } = await supabase.from("resources").delete().eq("id", params.id);

    if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Delete from Storage
    const { error: storageError } = await supabase.storage
        .from("resources")
        .remove([resource.file_url]);

    if (storageError) {
        console.error("Failed to delete file from storage:", storageError);
        // We don't return 500 here because DB record is gone, so it is effectively deleted for user.
    }

    return NextResponse.json({ ok: true });
}
