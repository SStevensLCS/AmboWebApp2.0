import Link from "next/link";
import AdminTabs from "./AdminTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Users, ChevronRight, Clock } from "lucide-react";
import { createAdminClient } from "@ambo/database/admin-client";

export default async function AdminPage() {
  const supabase = createAdminClient();

  // Fetch counts in parallel for at-a-glance metrics
  const [applicationsRes, pendingSubsRes, usersRes] = await Promise.all([
    supabase.from("applications").select("status", { count: "exact", head: false }).eq("status", "submitted"),
    supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "Pending"),
    supabase.from("users").select("id", { count: "exact", head: true }).in("role", ["student", "admin", "superadmin"]),
  ]);

  const pendingApps = applicationsRes.data?.length ?? 0;
  const pendingSubs = pendingSubsRes.count ?? 0;
  const totalUsers = usersRes.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage submissions and users.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/applications">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Applications</p>
                  <p className="text-xs text-muted-foreground">Review submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pendingApps > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] px-1.5">
                    {pendingApps}
                  </Badge>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/applicants">
          <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Applicants</p>
                  <p className="text-xs text-muted-foreground">Manage candidates</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Quick stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingSubs}</p>
                <p className="text-xs text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminTabs />
    </div>
  );
}
