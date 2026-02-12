import AdminTabs from "./AdminTabs";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Manage submissions and users.</p>
      </div>
      <AdminTabs />
    </div>
  );
}
