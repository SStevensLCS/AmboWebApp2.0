import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
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
