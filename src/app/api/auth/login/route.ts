import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    let phone: string;
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      phone = String(body.phone ?? "").trim();
    } else {
      const form = await req.formData();
      phone = String(form.get("phone") ?? "").trim();
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      return NextResponse.json(
        { error: "Phone number unrecognizable." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("phone", digits)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Phone number unrecognizable." },
        { status: 401 }
      );
    }

    await setSessionCookie({
      userId: user.id,
      role: user.role as "student" | "admin",
    });

    const redirectTo = user.role === "admin" ? "/admin" : "/student";
    return NextResponse.json({ redirect: redirectTo });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
