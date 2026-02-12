import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import EventChatWrapper from "./EventChatWrapper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
    const session = await getSession();
    if (!session || session.role !== "admin") redirect("/");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/events">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
                    <p className="text-muted-foreground">Schedule a new event for ambassadors.</p>
                </div>
            </div>
            <div className="max-w-2xl">
                <EventChatWrapper userId={session.userId} />
            </div>
        </div>
    );
}
