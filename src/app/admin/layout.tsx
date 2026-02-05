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
    <div className="min-h-screen flex flex-col">
      <header className="bg-navy text-white py-3 px-4 flex items-center justify-between">
        <Link href="/admin" className="font-semibold">
          Admin
        </Link>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-sky-blue text-sm">
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">{children}</main>
    </div>
  );
}
