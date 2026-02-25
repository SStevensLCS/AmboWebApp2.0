import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { AvatarUpload } from "@/components/AvatarUpload";
import { GoogleCalendarSetup } from "@/components/GoogleCalendarSetup";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AdminProfilePage() {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
        redirect("/");
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase
        .from("users")
        .select("first_name, last_name, avatar_url")
        .eq("id", session.userId)
        .single();

    return (
        <div className="space-y-6 pb-20">
            <div className="max-w-xl space-y-6">
                <AvatarUpload
                    currentAvatarUrl={user?.avatar_url || null}
                    firstName={user?.first_name || ""}
                    lastName={user?.last_name || ""}
                />

                <GoogleCalendarSetup />

                <PushNotificationManager />

                <div className="pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
                    <SignOutButton variant="destructive" className="w-full sm:w-auto" />
                </div>
            </div>
        </div>
    );
}
