import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NewSubmissionForm } from "./NewSubmissionForm";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function NewSubmissionPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("id", session.userId)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Log Service</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          {profile.first_name} {profile.last_name}
        </p>
      </div>
      <NewSubmissionForm userId={profile.id} />
    </div>
  );
}
