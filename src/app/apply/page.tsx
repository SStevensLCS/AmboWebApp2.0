import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ApplicationForm from "@/components/ApplicationForm";

export default async function ApplyPage() {
  const session = await getSession();

  // If user is already an applicant, send them to the status page
  if (session?.role === "applicant") {
    redirect("/status");
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <ApplicationForm userId={session?.userId} />
    </div>
  );
}
