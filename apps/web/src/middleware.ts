import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Routes that never require authentication
const PUBLIC_PATHS = [
  "/api/auth/",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
];

function roleHome(role: string): string {
  switch (role) {
    case "basic":
      return "/apply";
    case "applicant":
      return "/status";
    case "admin":
    case "superadmin":
      return "/admin";
    default:
      return "/student";
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Always allow API auth routes, public callback routes, and the root page
  // (the root page handles Supabase auth redirects for password reset flows)
  if (PUBLIC_PATHS.some((p) => path.startsWith(p)) || path === "/") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // ──────────────────────────────────────────
  // Guest pages: login and register
  // If already authenticated → redirect to their home
  // ──────────────────────────────────────────
  if (path.startsWith("/login") || path.startsWith("/register")) {
    if (session) {
      return NextResponse.redirect(new URL(roleHome(session.role), request.url));
    }
    return NextResponse.next();
  }

  // ──────────────────────────────────────────
  // Everything below requires a session
  // ──────────────────────────────────────────
  if (!session) {
    // /apply is accessible to both guests (public application) and logged-in basic users
    if (path.startsWith("/apply")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ──────────────────────────────────────────
  // Role-based access enforcement
  // ──────────────────────────────────────────
  const { role } = session;

  // basic → can only access /apply
  if (role === "basic") {
    if (!path.startsWith("/apply") && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/apply", request.url));
    }
    return NextResponse.next();
  }

  // applicant → can only access /status
  if (role === "applicant") {
    if (!path.startsWith("/status") && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/status", request.url));
    }
    return NextResponse.next();
  }

  // admin/superadmin → full access
  if (role === "admin" || role === "superadmin") {
    return NextResponse.next();
  }

  // student → can access /student and /apply, but not /admin
  if (path.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/student", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico)$).*)",
  ],
};
