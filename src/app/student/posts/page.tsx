import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PostsFeed } from "@/components/PostsFeed";

export default async function StudentPostsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") redirect("/");

    return (
        <div className="space-y-6">
            <div className="space-y-2 px-4 sm:px-0">
                <h1 className="text-3xl font-bold tracking-tight">Team Posts</h1>
                <p className="text-muted-foreground">Share updates and connect with the team.</p>
            </div>
            <PostsFeed currentUserId={session.userId} />
        </div>
    );
}
