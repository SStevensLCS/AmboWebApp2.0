import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewSubmissionForm } from "./NewSubmissionForm";

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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-navy">New Submission</h1>
      <p className="text-navy/70 text-sm">
        Submitting as {profile.first_name} {profile.last_name}
      </p>
      <NewSubmissionForm userId={profile.id} />
    </div>
  );
}
