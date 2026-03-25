import { NextRequest, NextResponse } from "next/server";
import { registerClient } from "@/lib/mcp/oauth-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { client_name, redirect_uris } = body;

    if (!client_name || typeof client_name !== "string") {
      return NextResponse.json(
        { error: "client_name is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      return NextResponse.json(
        { error: "redirect_uris must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate all redirect URIs are HTTPS (or localhost for dev)
    for (const uri of redirect_uris) {
      try {
        const parsed = new URL(uri);
        if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
          return NextResponse.json(
            { error: `redirect_uri must use HTTPS: ${uri}` },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: `Invalid redirect_uri: ${uri}` },
          { status: 400 }
        );
      }
    }

    const client = await registerClient(client_name, redirect_uris);

    return NextResponse.json(client, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("OAuth register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
