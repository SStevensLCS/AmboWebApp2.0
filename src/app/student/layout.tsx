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
  if (session.role === "admin") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col pb-20 safe-bottom">
      <header className="bg-navy text-white py-2 px-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-semibold text-sm">Ambassador</span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-sky-blue text-sm">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">{children}</main>
      <StudentNav />
    </div>
  );
}
