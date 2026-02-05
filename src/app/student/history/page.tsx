import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";

const statusStyles: Record<string, string> = {
  Approved: "bg-green-100 text-green-800",
  Denied: "bg-red-100 text-red-800",
  Pending: "bg-yellow-100 text-yellow-800",
};

export default async function SubmissionHistoryPage() {
  const session = await getSession();
  if (!session || session.role !== "student") redirect("/login");

  const supabase = createAdminClient();
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, service_date, service_type, hours, credits, status")
    .eq("user_id", session.userId)
    .order("service_date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-navy">Submission History</h1>

      {!submissions?.length ? (
        <p className="text-navy/70">No submissions yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-4">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-navy/20 text-left text-navy/70">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2">Hours</th>
                <th className="py-2 px-2">Credits</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-navy/10">
                  <td className="py-2 px-2">{s.service_date}</td>
                  <td className="py-2 px-2">{s.service_type}</td>
                  <td className="py-2 px-2">{Number(s.hours)}</td>
                  <td className="py-2 px-2">{Number(s.credits)}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusStyles[s.status] ?? "bg-gray-100"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link
        href="/student/new"
        className="inline-block mt-4 py-2 px-4 rounded-lg bg-sky-blue text-navy font-medium"
      >
        New Submission
      </Link>
    </div>
  );
}
