import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import StudentNav from "./StudentNav";
import { StudentSidebar } from "@/components/StudentSidebar";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <StudentSidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <StudentNav />
    </div>
  );
}
