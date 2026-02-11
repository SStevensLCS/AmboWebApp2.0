import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminEventsContent } from "./AdminEventsContent";

export default async function AdminEventsPage() {
    const session = await getSession();
    if (!session || session.role !== "admin") redirect("/");

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-xl tracking-wide">Events</h1>
                <Link href="/admin/events/new" className="glass-btn-primary py-2 px-4 text-sm no-underline">
                    + New Event
                </Link>
            </div>
            <AdminEventsContent userId={session.userId} />
        </div>
    );
}
