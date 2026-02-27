import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { NewSubmissionForm } from "./NewSubmissionForm";
import { createAdminClient } from "@ambo/database/admin-client";

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

      <NewSubmissionForm userId={profile.id} />
    </div>
  );
}
