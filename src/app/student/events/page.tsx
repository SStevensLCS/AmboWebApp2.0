import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StudentEventsContent } from "./StudentEventsContent";

export default async function StudentEventsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") redirect("/");

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Events</h1>
                <p className="text-muted-foreground">View upcoming events and RSVP.</p>
            </div>
            <StudentEventsContent userId={session.userId} />
        </div>
    );
}
