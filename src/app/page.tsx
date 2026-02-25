import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  // Supabase password-reset emails redirect to the site URL (/) when
  // /auth/callback isn't in the project's redirect allowlist.
  // Forward the code there so the reset flow can complete.
  if (searchParams.code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=/reset-password`
    );
  }

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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
