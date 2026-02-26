import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ApplicationForm from "@/components/ApplicationForm";
import ApplyLandingPage from "@/components/ApplyLandingPage";
import { getApplicationByUserId, getUserData, getActualUserRole } from "@/actions/application";

function roleHome(role: string): string {
  switch (role) {
    case "basic":
      return "/apply";
    case "applicant":
      return "/status";
    case "admin":
    case "superadmin":
      return "/admin";
    default:
      return "/student";
  }
}

export default async function ApplyPage() {
  const session = await getSession();

  // If user is already an applicant, send them to the status page
  if (session?.role === "applicant") {
    redirect("/status");
  }

  // Check if the user's role was changed in the DB (e.g. admin promoted to student).
  // The JWT may be stale, so we read the actual role from the database.
  if (session?.userId) {
    const actualRole = await getActualUserRole(session.userId);
    if (actualRole && actualRole !== "basic") {
      redirect(roleHome(actualRole));
    }
  }

  // Logged-in basic user: show landing page with options
  if (session?.userId && session.role === "basic") {
    const userData = await getUserData(session.userId);
    const application = await getApplicationByUserId(session.userId);

    const hasApplication = !!application && application.status === "draft";
    const currentStep = application?.current_step || 1;
    const totalSteps = 4; // Simplified form: Personal Info, Academic, References, Questionnaire

    return (
      <ApplyLandingPage
        hasApplication={hasApplication}
        currentStep={currentStep}
        totalSteps={totalSteps}
        phone={userData.phone}
      />
    );
  }

  // Guest (not logged in): show the full application form directly
  return (
    <div className="min-h-screen bg-bg-secondary py-12">
      <ApplicationForm userId={session?.userId} />
    </div>
  );
}
