import Link from "next/link";
import { AdminEventsContent } from "./AdminEventsContent";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AdminEventsPage() {
    const session = await getSession();

    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        redirect("/login");
    }

    const userId = session.userId;

    return (
        <div className="relative">
            <AdminEventsContent userId={userId} userRole={session.role} />
            <Link
                href="/admin/events/new"
                className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
                <Plus className="h-6 w-6" />
            </Link>
        </div>
    );
}
