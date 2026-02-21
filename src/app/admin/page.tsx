import AdminTabs from "./AdminTabs";
import { GoogleCalendarSetup } from "@/components/GoogleCalendarSetup";
import { PushNotificationManager } from "@/components/PushNotificationManager";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage submissions and users.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GoogleCalendarSetup />
        <PushNotificationManager />
      </div>
      <AdminTabs />
    </div>
  );
}
