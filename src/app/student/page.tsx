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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your progress and history.</p>
      </div>

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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Submissions</h2>
        <Card>
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions?.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.service_date}</TableCell>
                    <TableCell>{submission.service_type}</TableCell>
                    <TableCell>{Number(submission.hours)}</TableCell>
                    <TableCell>{Number(submission.credits)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          submission.status === "Approved"
                            ? "default" // Map to default/success
                            : submission.status === "Denied"
                              ? "destructive"
                              : "secondary" // Pending
                        }
                        className={
                          submission.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200" :
                            submission.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200"
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!submissions || submissions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No submissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="sm:hidden divide-y">
            {submissions?.map((submission) => (
              <div key={submission.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{submission.service_date}</span>
                  <Badge
                    variant={
                      submission.status === "Approved"
                        ? "default"
                        : submission.status === "Denied"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      submission.status === "Approved" ? "bg-green-100 text-green-800 border-green-200" :
                        submission.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {submission.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Type</span>
                    {submission.service_type}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Hours</span>
                    {Number(submission.hours)}
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Credits</span>
                    {Number(submission.credits)}
                  </div>
                </div>
              </div>
            ))}
            {(!submissions || submissions.length === 0) && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No submissions found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
