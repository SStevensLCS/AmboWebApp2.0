import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/");

  const supabase = createAdminClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("hours, credits, status")
    .eq("user_id", session.userId);

  const all = submissions || [];
  const approved = all.filter((s: any) => s.status === "approved");
  const pending = all.filter((s: any) => s.status === "pending");

  const totalHours = all.reduce((sum: number, s: any) => sum + (s.hours || 0), 0);
  const totalCredits = all.reduce((sum: number, s: any) => sum + (s.credits || 0), 0);
  const approvedHours = approved.reduce((sum: number, s: any) => sum + (s.hours || 0), 0);
  const approvedCredits = approved.reduce((sum: number, s: any) => sum + (s.credits || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl tracking-wide">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
            Total Hours
          </p>
          <p className="text-3xl">{totalHours}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {approvedHours} approved
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
            Tour Credits
          </p>
          <p className="text-3xl">{totalCredits}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {approvedCredits} approved
          </p>
        </div>
      </div>

      <div className="glass-card p-5">
        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
          Total Submissions
        </p>
        <p className="text-3xl">{all.length}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          {approved.length} approved · {pending.length} pending
        </p>
      </div>
    </div>
  );
}
