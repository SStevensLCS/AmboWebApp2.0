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
        // Negative margins cancel the layout's p-4 pb-24 (mobile) / md:p-8 md:pb-8
        // so ChatLayout can fill exactly the viewport height minus the nav bar.
        <div className="-mt-4 -mb-24 md:-mt-8 md:-mb-8">
            <ChatLayout currentUserId={session.userId} pageTitle="Ambassador Chat" />
        </div>
    );
}
