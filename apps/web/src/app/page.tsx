import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AuthHashHandler from "@/components/AuthHashHandler";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  // PKCE flow: Supabase puts the code in a query param when redirectTo IS
  // in the allowlist. Forward it to our callback to exchange for a session.
  if (searchParams.code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=/reset-password`
    );
  }

  // Always render the client component so it can check for implicit-flow
  // hash fragments (e.g. #access_token=...&type=recovery). Hash fragments
  // are invisible to the server, so we can't detect recovery links here.
  // If there are no hash fragments, AuthHashHandler handles the role-based
  // redirect (or sends unauthenticated users to /login).
  const session = await getSession();
  return <AuthHashHandler sessionRole={session?.role ?? null} />;
}
