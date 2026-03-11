import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import EventChatWrapper from "./EventChatWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/events">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Create Event</h1>
            </div>
            <div className="max-w-2xl">
                <EventChatWrapper userId={session.userId} />
            </div>
        </div>
    );
}
