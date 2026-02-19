import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "ambo_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  role: "student" | "admin" | "superadmin" | "applicant";
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
    const role = payload.role as "student" | "admin" | "superadmin" | "applicant";
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
    const role = payload.role as "student" | "admin" | "superadmin" | "applicant";
    if (!userId || !role) return null;
    return { userId, role };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
