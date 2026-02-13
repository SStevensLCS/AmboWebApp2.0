import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { SignOutButton } from "@/components/SignOutButton";

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

            <div className="max-w-xl space-y-6">
                <PushNotificationManager />

                <div className="pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
                    <SignOutButton variant="destructive" className="w-full sm:w-auto" />
                </div>
            </div>
        </div>
    );
}
