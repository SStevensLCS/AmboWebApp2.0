import { getSession } from "@/lib/session";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { redirect } from "next/navigation";

export default async function StudentChatPage() {
    const session = await getSession();

    if (!session || (session.role !== "student" && session.role !== "applicant")) {
        // Middleware might handle this, but double check
        // redirect("/login"); // Optional if middleware covers it
    }

    // Should we enforce student role? The path implies it. 
    // If an admin goes here, maybe redirect to admin chat?

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-4">Team Chat</h1>
            <ChatLayout currentUserId={session.userId} />
        </div>
    );
}
