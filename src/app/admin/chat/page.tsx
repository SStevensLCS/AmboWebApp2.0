import { getSession } from "@/lib/session";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { redirect } from "next/navigation";

export default async function AdminChatPage() {
    const session = await getSession();

    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        // redirect("/login");
    }

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-4">Ambassador Chat</h1>
            <ChatLayout currentUserId={session.userId} />
        </div>
    );
}
