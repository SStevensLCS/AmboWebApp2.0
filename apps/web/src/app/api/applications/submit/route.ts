import { createAdminClient } from "@ambo/database/admin-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const phone = body.phone_number;

  if (!phone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("applications")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("phone_number", phone);

  if (error) {
    console.error("Error submitting application:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  // Promote any basic user with this phone number to applicant
  await supabase
    .from("users")
    .update({ role: "applicant" })
    .eq("phone", phone)
    .eq("role", "basic");

  return NextResponse.json({ success: true });
}
