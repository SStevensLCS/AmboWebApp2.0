import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ApplicationForm from "@/components/ApplicationForm";
import { getApplicationByUserId, getUserData, getActualUserRole } from "@/actions/application";

export default async function ApplyFormPage({
  searchParams,
}: {
  searchParams: { resume?: string };
}) {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/apply");
  }

  // Check if the user's role was changed in the DB (e.g. admin promoted to student).
  // Redirect to the refresh-session API route to update the stale JWT cookie.
  const actualRole = await getActualUserRole(session.userId);
  if (actualRole && actualRole !== "basic") {
    redirect("/api/auth/refresh-session");
  }

  const userData = await getUserData(session.userId);
  const isResume = searchParams.resume === "true";

  let initialApplication = null;
  let resumeStep: number | undefined;

  if (isResume) {
    const application = await getApplicationByUserId(session.userId);
    if (application && application.status === "draft") {
      initialApplication = application;
      // current_step is 1-based in DB; convert to 0-based index for the simplified form
      // The simplified form starts at step 0 (Personal Info), so saved step 1 → index 0, step 2 → index 1, etc.
      resumeStep = Math.max(0, (application.current_step || 1) - 1);
    }
  }

  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <ApplicationForm
        userId={session.userId}
        userData={{
          firstName: userData.first_name,
          lastName: userData.last_name,
          phone: userData.phone,
          email: userData.email,
        }}
        initialData={initialApplication}
        resumeStep={resumeStep}
      />
    </div>
  );
}
