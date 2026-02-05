import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { authorized } = await requireAdmin();
  if (!authorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have header and at least one row" },
      { status: 400 }
    );
  }

  const headers = parseCSVLine(lines[0]);
  const fnIdx = headers.indexOf("first_name");
  const lnIdx = headers.indexOf("last_name");
  const phoneIdx = headers.indexOf("phone");
  const emailIdx = headers.indexOf("email");
  const roleIdx = headers.indexOf("role");

  if (fnIdx < 0 || lnIdx < 0 || phoneIdx < 0 || emailIdx < 0) {
    return NextResponse.json(
      { error: "CSV must include first_name, last_name, phone, email" },
      { status: 400 }
    );
  }

  const rows: Array<{
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    role: "student" | "admin";
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const first_name = cells[fnIdx]?.trim();
    const last_name = cells[lnIdx]?.trim();
    const phone = (cells[phoneIdx] || "").replace(/\D/g, "");
    const email = cells[emailIdx]?.trim();
    if (!first_name || !last_name || phone.length !== 10 || !email) continue;

    rows.push({
      first_name,
      last_name,
      phone,
      email,
      role:
        roleIdx >= 0 && cells[roleIdx]?.trim() === "admin" ? "admin" : "student",
    });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("users").upsert(rows, {
    onConflict: "phone",
    ignoreDuplicates: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, count: rows.length });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || (c === "\t" && !inQuotes)) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
