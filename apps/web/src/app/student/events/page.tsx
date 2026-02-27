import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StudentEventsContent } from "./StudentEventsContent";

export default async function StudentEventsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") redirect("/");

    return (
        <div className="space-y-6">

            <StudentEventsContent userId={session.userId} userRole={session.role} />
        </div>
    );
}
