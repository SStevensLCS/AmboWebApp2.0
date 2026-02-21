import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminMobileBottomNav from "@/components/AdminMobileBottomNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Desktop Sidebar */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 pb-24 md:p-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <AdminMobileBottomNav />
    </div>
  );
}
