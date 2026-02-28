import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    const session = await getSessionFromRequest(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = (formData.get("file") || formData.get("avatar")) as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${session.userId}.${fileExt}`;

        const { error: storageError } = await supabase.storage
            .from("avatars")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (storageError) {
            return NextResponse.json({ error: storageError.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

        const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

        const { error: dbError } = await supabase
            .from("users")
            .update({ avatar_url: avatarUrl })
            .eq("id", session.userId);

        if (dbError) {
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ avatar_url: avatarUrl });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
