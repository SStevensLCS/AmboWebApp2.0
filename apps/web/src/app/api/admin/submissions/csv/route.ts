import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@ambo/database/admin-client";
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
  const userIdx = headers.indexOf("user_id");
  const dateIdx = headers.indexOf("service_date");
  const typeIdx = headers.indexOf("service_type");
  const creditsIdx = headers.indexOf("credits");
  const hoursIdx = headers.indexOf("hours");
  const feedbackIdx = headers.indexOf("feedback");
  const statusIdx = headers.indexOf("status");

  if (userIdx < 0 || dateIdx < 0 || typeIdx < 0) {
    return NextResponse.json(
      { error: "CSV must include user_id, service_date, service_type" },
      { status: 400 }
    );
  }

  const rows: Array<{
    user_id: string;
    service_date: string;
    service_type: string;
    credits: number;
    hours: number;
    feedback: string | null;
    status: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const user_id = cells[userIdx]?.trim();
    const service_date = cells[dateIdx]?.trim();
    const service_type = cells[typeIdx]?.trim();
    if (!user_id || !service_date || !service_type) continue;

    rows.push({
      user_id,
      service_date,
      service_type,
      credits: creditsIdx >= 0 ? parseFloat(cells[creditsIdx] || "0") || 0 : 0,
      hours: hoursIdx >= 0 ? parseFloat(cells[hoursIdx] || "0") || 0 : 0,
      feedback:
        feedbackIdx >= 0 && cells[feedbackIdx]?.trim()
          ? cells[feedbackIdx].trim()
          : null,
      status:
        statusIdx >= 0 && ["Pending", "Approved", "Denied"].includes(cells[statusIdx]?.trim() || "")
          ? cells[statusIdx].trim()
          : "Pending",
    });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("submissions").insert(rows);

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
