import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StudentEventsContent } from "./StudentEventsContent";

export default async function StudentEventsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") redirect("/");

    return (
        <div className="space-y-4 animate-fade-in pb-20">
            <h1 className="text-xl tracking-wide">Upcoming Events</h1>
            <StudentEventsContent userId={session.userId} />
        </div>
    );
}
