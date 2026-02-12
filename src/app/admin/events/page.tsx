import Link from "next/link";
import { AdminEventsContent } from "./AdminEventsContent";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminEventsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                    <p className="text-muted-foreground">Manage and view upcoming events.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/events/new" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Event
                    </Link>
                </Button>
            </div>
            <AdminEventsContent userId={user.id} />
        </div>
    );
}
