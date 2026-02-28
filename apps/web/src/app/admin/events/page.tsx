import Link from "next/link";
import { AdminEventsContent } from "./AdminEventsContent";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Manage and view upcoming events.</p>
                </div>
                <Button asChild className="self-start sm:self-auto">
                    <Link href="/admin/events/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Event
                    </Link>
                </Button>
            </div>
            <AdminEventsContent userId={userId} userRole={session.role} />
        </div>
    );
}
