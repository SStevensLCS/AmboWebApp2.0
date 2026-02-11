import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/");

  const supabase = createAdminClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl tracking-wide">History</h1>

      <div className="glass-panel overflow-x-auto">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Hours</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions?.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.service_date).toLocaleDateString()}</td>
                <td>{s.service_type}</td>
                <td>{s.hours}</td>
                <td>{s.credits}</td>
                <td>
                  <span
                    className={
                      s.status === "approved"
                        ? "badge-approved"
                        : s.status === "denied"
                          ? "badge-denied"
                          : "badge-pending"
                    }
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr>
                <td colSpan={5} className="text-center text-[var(--text-tertiary)] py-8">
                  No submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
