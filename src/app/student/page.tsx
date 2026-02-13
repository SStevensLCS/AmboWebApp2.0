import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Award, CheckCircle } from "lucide-react";
import DashboardClient from "./DashboardClient";

interface Submission {
  id: string;
  user_id: string;
  service_date: string;
  service_type: string;
  hours: number;
  credits: number;
  status: "Approved" | "Denied" | "Pending";
  created_at: string;
}

export default async function StudentDashboard() {
  const session = await getSession();

  if (!session || session.role !== "student") {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Fetch all submissions for history
  const { data: submissionsData } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const submissions = (submissionsData as Submission[]) || [];

  // Calculate stats
  const totalHours =
    submissions.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0) || 0;
  const totalCredits =
    submissions.reduce((acc, curr) => acc + (Number(curr.credits) || 0), 0) || 0;
  // Assuming "Approved" is the status for completed
  const completedEvents =
    submissions.filter((s) => s.status === "Approved").length || 0;

  const stats = [
    {
      label: "Total Hours",
      value: totalHours.toFixed(1),
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Total Credits",
      value: totalCredits.toFixed(1),
      icon: Award,
      color: "text-purple-600",
    },
    {
      label: "Events Completed",
      value: completedEvents,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">


      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color} text-muted-foreground`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DashboardClient submissions={submissions} />
    </div>
  );
}
