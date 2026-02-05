import { AdminTabs } from "./AdminTabs";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-navy">Admin Dashboard</h1>
      <AdminTabs />
    </div>
  );
}
