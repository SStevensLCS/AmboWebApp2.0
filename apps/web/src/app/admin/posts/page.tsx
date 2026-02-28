import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PostsFeed } from "@/components/PostsFeed";

export default async function AdminPostsPage() {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) redirect("/");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Team Posts</h1>
                <p className="text-muted-foreground text-sm md:text-base">Announcements and updates for the team.</p>
            </div>
            <PostsFeed currentUserId={session.userId} currentUserRole={session.role} />
        </div>
    );
}
