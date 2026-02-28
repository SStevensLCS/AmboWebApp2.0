import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  await clearSessionCookie();
  const url = new URL("/login", req.url);
  return NextResponse.redirect(url, 302);
}
