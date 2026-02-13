import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";
import StudentNav from "./StudentNav";
import { StudentDesktopNav } from "./StudentDesktopNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || (session.role !== "student" && session.role !== "admin" && session.role !== "superadmin")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-20 sm:pb-6">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm sm:hidden">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Ambassador Portal" width={32} height={32} className="object-contain" />
          <span className="text-lg font-bold tracking-tight">Ambassador Portal</span>
        </div>
        <form action="/api/auth/signout" method="post">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </header>

      {/* Desktop Header */}
      <header className="hidden sm:flex sticky top-0 z-30 h-16 items-center border-b bg-background px-6 shadow-sm mb-6">
        <div className="flex w-full items-center justify-between mx-auto max-w-screen-md">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Ambassador Portal" width={40} height={40} className="object-contain" />
              <span className="text-lg font-bold tracking-tight">Ambassador Portal</span>
            </div>
            <StudentDesktopNav />
          </div>
          <div className="flex items-center gap-4">
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-md p-4 sm:p-0">{children}</main>
      <StudentNav />
    </div>
  );
}
