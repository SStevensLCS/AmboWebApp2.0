import { createAdminClient } from "@ambo/database/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("phone_number", phone)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.phone_number || !/^\d{10,}$/.test(body.phone_number)) {
    return NextResponse.json(
      { error: "A valid phone number (10+ digits) is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const payload = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("applications")
    .upsert(payload, { onConflict: "phone_number" });

  if (error) {
    console.error("Error saving application:", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
