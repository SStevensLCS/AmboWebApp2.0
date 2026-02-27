import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ambo_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  role: "basic" | "student" | "admin" | "superadmin" | "applicant";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  return new TextEncoder().encode(secret || "");
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string;
    const role = payload.role as "basic" | "student" | "admin" | "superadmin" | "applicant";
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  if (!process.env.SESSION_SECRET && !process.env.AUTH_SECRET) {
    throw new Error("SESSION_SECRET or AUTH_SECRET must be set");
  }
  const token = await createSession(payload);
  const cookieStore = await cookies();

  console.log("Setting session cookie for user:", payload.userId, "Role:", payload.role);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
  console.log("Session cookie set successfully");
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Use in middleware (Edge) where cookies() is not available. */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId as string;
    const role = payload.role as "basic" | "student" | "admin" | "superadmin" | "applicant";
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

/**
 * Extract session from an incoming request.
 * Checks the Authorization header (Bearer token) first, then falls back to the cookie.
 * Use this in API route handlers where the request object is available.
 */
export async function getSessionFromRequest(
  req: Request
): Promise<SessionPayload | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifySessionToken(token);
  }

  return getSession();
}

export { COOKIE_NAME };
