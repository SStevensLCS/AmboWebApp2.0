import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;


  console.log("Middleware checking path:", path);

  if (
    path.startsWith("/login") ||
    path.startsWith("/api/auth/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/api/auth/forgot-password") ||
    path.startsWith("/auth/callback")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  console.log("Cookie token present:", !!token);

  const session = token ? await verifySessionToken(token) : null;
  console.log("Session verified:", !!session, "Role:", session?.role);

  if (path.startsWith("/student") || path.startsWith("/admin")) {
    if (!session) {
      console.log("No session, redirecting to login");
      const login = new URL("/login", request.url);
      return NextResponse.redirect(login);
    }
    if (path.startsWith("/admin") && !["admin", "superadmin"].includes(session.role)) {
      console.log("Admin path access denied for role:", session.role);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico)$).*)",
  ],
};
