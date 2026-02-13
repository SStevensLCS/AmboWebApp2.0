import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PostsFeed } from "@/components/PostsFeed";

export default async function StudentPostsPage() {
    const session = await getSession();
    if (!session || session.role !== "student") redirect("/");

    return (
        <div className="space-y-6">

            <PostsFeed currentUserId={session.userId} currentUserRole={session.role} />
        </div>
    );
}
