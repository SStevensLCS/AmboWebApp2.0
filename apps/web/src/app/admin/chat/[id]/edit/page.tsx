import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { EditChatForm } from "@/components/chat/EditChatForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminEditChatPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) redirect("/login");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/chat?group=${params.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-lg font-semibold">Edit Chat</h1>
            </div>
            <EditChatForm groupId={params.id} backPath="/admin/chat" />
        </div>
    );
}
