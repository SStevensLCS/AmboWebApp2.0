import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PostsFeed } from "@/components/PostsFeed";

export default async function AdminPostsPage() {
    const session = await getSession();
    if (!session || session.role !== "admin") redirect("/");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Posts</h1>
                <p className="text-muted-foreground">Announcements and updates for the team.</p>
            </div>
            <PostsFeed currentUserId={session.userId} />
        </div>
    );
}
