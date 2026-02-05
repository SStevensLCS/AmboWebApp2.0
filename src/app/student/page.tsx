import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

function getSemesterBounds(now: Date): { start: Date; end: Date } {
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 5) {
    return { start: new Date(year, 5, 1), end: new Date(year, 11, 31) };
  }
  return { start: new Date(year - 1, 5, 1), end: new Date(year, 4, 31) };
}

function getJune1ThisYear(now: Date): Date {
  const year = now.getFullYear();
  return now.getMonth() >= 5 ? new Date(year, 5, 1) : new Date(year - 1, 5, 1);
}

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();
  const now = new Date();
  const june1 = getJune1ThisYear(now);
  const june1Str = june1.toISOString().slice(0, 10);
  const { start: semStart, end: semEnd } = getSemesterBounds(now);
  const semStartStr = semStart.toISOString().slice(0, 10);
  const semEndStr = semEnd.toISOString().slice(0, 10);

  const { data: hoursSubs } = await supabase
    .from("submissions")
    .select("hours")
    .eq("user_id", session.userId)
    .eq("status", "Approved")
    .gte("service_date", june1Str);

  const totalHours = (hoursSubs ?? []).reduce(
    (sum, s) => sum + (Number(s.hours) || 0),
    0
  );

  const { data: semSubs } = await supabase
    .from("submissions")
    .select("credits")
    .eq("user_id", session.userId)
    .eq("status", "Approved")
    .gte("service_date", semStartStr)
    .lte("service_date", semEndStr);

  const currentSemesterCredits = (semSubs ?? []).reduce(
    (sum, s) => sum + (Number(s.credits) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-navy">Dashboard</h1>

      <section className="rounded-xl bg-navy/5 border border-navy/10 p-4">
        <h2 className="text-sm font-medium text-navy/70 mb-1">
          Total Hours (since latest June 1)
        </h2>
        <p className="text-2xl font-semibold text-navy">
          {totalHours.toFixed(1)}
        </p>
      </section>

      <section className="rounded-xl bg-navy/5 border border-navy/10 p-4">
        <h2 className="text-sm font-medium text-navy/70 mb-1">
          Current Semester Credits
        </h2>
        <p className="text-2xl font-semibold text-navy">
          {currentSemesterCredits.toFixed(1)}
        </p>
        <p className="text-xs text-navy/60 mt-1">
          {semStartStr} – {semEndStr}
        </p>
      </section>
    </div>
  );
}
