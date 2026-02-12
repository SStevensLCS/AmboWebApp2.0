import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/40 pb-safe-bottom">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 sm:px-6 shadow-sm">
        <div className="flex w-full items-center justify-between mx-auto max-w-5xl">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight">Ambassador Portal</h1>
            <nav className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/events">Events</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/posts">Posts</Link>
              </Button>
            </nav>
          </div>
          <form action="/api/auth/signout" method="post">
            <Button variant="ghost" size="icon" title="Sign Out">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sign Out</span>
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
