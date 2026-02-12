import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PushNotificationManager } from "@/components/PushNotificationManager";

export default async function StudentProfilePage() {
    const session = await getSession();
    if (!session || session.role !== "student") {
        redirect("/");
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
                <p className="text-muted-foreground">Manage your account preferences.</p>
            </div>

            <div className="max-w-xl">
                <PushNotificationManager />
            </div>
        </div>
    );
}
