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

  const session = await getSession();

  if (session) {
    switch (session.role) {
      case "basic":
        redirect("/apply");
      case "applicant":
        redirect("/status");
      case "admin":
      case "superadmin":
        redirect("/admin");
      default:
        redirect("/student");
    }
  }

  // No session and no query-param code. The user may have arrived here from a
  // Supabase password-reset email that used the implicit flow (hash fragment).
  // Hash fragments are invisible to the server, so we render a client component
  // that reads window.location.hash and handles it before redirecting.
  return <AuthHashHandler />;
}
