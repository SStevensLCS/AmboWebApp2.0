import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CreateChatForm } from "@/components/chat/CreateChatForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminNewChatPage() {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) redirect("/login");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/chat">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">New Chat</h1>
            </div>
            <CreateChatForm backPath="/admin/chat" />
        </div>
    );
}
