import AdminTabs from "./AdminTabs";

export default function AdminPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl tracking-wide">Dashboard</h1>
      <AdminTabs />
    </div>
  );
}
