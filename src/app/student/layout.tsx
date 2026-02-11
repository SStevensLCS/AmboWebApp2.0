import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { StudentNav } from "./StudentNav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) redirect("/login");
  if (session.role !== "student") redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="glass-header py-3 px-4 flex items-center justify-between sticky top-0 z-20">
        <span className="text-xl tracking-wide">Ambassador</span>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-24 relative z-10">
        {children}
      </main>
      <StudentNav />
    </div>
  );
}
