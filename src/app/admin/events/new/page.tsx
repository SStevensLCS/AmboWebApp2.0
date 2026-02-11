import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { EventChatWrapper } from "./EventChatWrapper";

export default async function NewEventPage() {
    const session = await getSession();
    if (!session || session.role !== "admin") redirect("/");

    return (
        <div className="space-y-4 animate-fade-in">
            <h1 className="text-xl tracking-wide">Create Event</h1>
            <p className="text-[var(--text-tertiary)] text-sm">
                Fill in the details below.
            </p>
            <EventChatWrapper userId={session.userId} />
        </div>
    );
}
