import { requireAdmin } from "@/lib/admin";
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, user } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.first_name === "string") updates.first_name = body.first_name.trim();
  if (typeof body.last_name === "string") updates.last_name = body.last_name.trim();
  if (typeof body.email === "string") updates.email = body.email.trim();
  if (typeof body.phone === "string") {
    const phone10 = body.phone.replace(/\D/g, "");
    if (phone10.length === 10) updates.phone = phone10;
  }
  if (["admin", "student", "superadmin"].includes(body.role)) {
    if (body.role === "superadmin") {
      // Validating that only a superadmin can promote someone to superadmin
      const { data: requester } = await supabase
        .from("users")
        .select("role")
        .eq("id", user?.userId)
        .single();
      
      if (requester?.role !== "superadmin") {
        return NextResponse.json(
          { error: "Only superadmins can promote users to superadmin." },
          { status: 403 }
        );
      }
    }
    updates.role = body.role;
  }

  const { error } = await supabase.from("users").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // When promoting to admin/superadmin, ensure the user has a Supabase Auth account
  if (body.role === "admin" || body.role === "superadmin") {
    // Check if auth account already exists
    const { data: authUser } = await adminClient.auth.admin.getUserById(id);

    if (!authUser?.user) {
      // Fetch the user's profile to get email & phone for account creation
      const { data: profile } = await supabase
        .from("users")
        .select("email, phone")
        .eq("id", id)
        .single();

      if (profile?.email && profile?.phone) {
        const phone10 = profile.phone.replace(/\D/g, "");
        const { error: authError } = await adminClient.auth.admin.createUser({
          id,
          email: profile.email,
          password: phone10.length === 10 ? phone10 : profile.phone,
          email_confirm: true,
        });

        if (authError) {
          console.error("Failed to create auth account on role promotion:", authError.message);
          // Don't fail the request — role was already updated successfully
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, supabase, user } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Fetch my role (requireAdmin might technically just check 'admin' row existence, so let's be safe and fetch my role)
  // Actually requireAdmin usually fetches the user row. Let's see src/lib/admin.ts content.
  // If it doesn't return user role, we fetch it.

  // Fetch my detailed role
  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user?.userId)
    .single();

  const myRole = me?.role;

  // Fetch target user role
  const { data: targetUser, error: fetchError } = await supabase
    .from("users")
    .select("role")
    .eq("id", id)
    .single();

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isSuperAdmin = myRole === "superadmin";
  const targetIsAdmin = targetUser.role === "admin";
  const targetIsSuperAdmin = targetUser.role === "superadmin";

  if (!isSuperAdmin) {
    // If I'm not superadmin (so I am just admin), I cannot delete other admins or superadmins.
    if (targetIsAdmin || targetIsSuperAdmin) {
      return NextResponse.json({ error: "Admins cannot delete other admins/superadmins." }, { status: 403 });
    }
  }

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
