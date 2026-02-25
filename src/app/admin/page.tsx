import Link from "next/link";
import AdminTabs from "./AdminTabs";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, ChevronRight } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">Manage submissions and users.</p>
      </div>

      <div className="grid gap-4 grid-cols-2">
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
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
      </div>

      <AdminTabs />
    </div>
  );
}
