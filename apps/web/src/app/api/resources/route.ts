import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@ambo/database/admin-client";

export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: resources, error } = await supabase
        .from("resources")
        .select("* ")
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get public URL for each resource
    const resourcesWithUrls = resources.map((res) => {
        const { data } = supabase.storage.from("resources").getPublicUrl(res.file_url);
        return { ...res, publicUrl: data.publicUrl };
    });

    return NextResponse.json({ resources: resourcesWithUrls });
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;

        if (!file || !title) {
            return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
        }

        const supabase = createAdminClient();
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

        // Upload to Storage
        const { data: storageData, error: storageError } = await supabase.storage
            .from("resources")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false,
            });

        if (storageError) {
            return NextResponse.json({ error: "Storage Upload Failed: " + storageError.message }, { status: 500 });
        }

        // Insert into DB
        const { data: resource, error: dbError } = await supabase
            .from("resources")
            .insert({
                title,
                description,
                file_url: fileName,
                file_type: file.type,
                file_size: file.size,
                uploaded_by: session.userId,
            })
            .select()
            .single();

        if (dbError) {
            return NextResponse.json({ error: "Database Insert Failed: " + dbError.message }, { status: 500 });
        }

        return NextResponse.json({ resource });
    } catch (err: any) {
        return NextResponse.json({ error: "Upload Error: " + err.message }, { status: 500 });
    }
}
