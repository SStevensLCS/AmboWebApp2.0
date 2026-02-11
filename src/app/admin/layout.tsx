import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="glass-header py-3 px-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-xl tracking-wide hover:opacity-60 transition-opacity"
          >
            Admin
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/admin"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/events"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Events
            </Link>
          </nav>
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
