import { createAdminClient } from "@ambo/database/admin-client";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const phone = formData.get("phone") as string | null;

  if (!file || !phone) {
    return NextResponse.json({ error: "File and phone number are required" }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  // Validate file type by magic bytes (PDF: %PDF)
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const isPdf =
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46;

  if (!isPdf) {
    return NextResponse.json({ error: "Transcript must be a PDF file" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const fileName = `${phone}_transcript_${uuidv4()}.pdf`;

  const { error } = await supabase.storage
    .from("transcripts")
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading transcript:", error);
    return NextResponse.json({ error: "Failed to upload transcript" }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("transcripts").getPublicUrl(fileName);

  return NextResponse.json({ publicUrl });
}
