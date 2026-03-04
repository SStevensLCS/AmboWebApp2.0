import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PostsFeed } from "@/components/PostsFeed";

export default async function AdminPostsPage() {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) redirect("/");

    return (
        <PostsFeed currentUserId={session.userId} currentUserRole={session.role} basePath="/admin/posts" />
    );
}
