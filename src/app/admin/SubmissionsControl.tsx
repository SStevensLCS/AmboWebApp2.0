"use client";

import { useEffect, useState } from "react";
import { SERVICE_TYPES } from "@/lib/types";

type SubRow = {
  id: string;
  user_id: string;
  service_date: string;
  service_type: string;
  credits: number;
  hours: number;
  feedback: string | null;
  status: string;
  created_at?: string;
  users: { first_name: string; last_name: string; email: string } | null;
};

export function SubmissionsControl() {
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubRow>>({});
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  const fetchSubmissions = async () => {
    const res = await fetch("/api/admin/submissions");
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const startEdit = (row: SubRow) => {
    setEditing(row.id);
    setEditForm({
      service_date: row.service_date,
      service_type: row.service_type,
      credits: row.credits,
      hours: row.hours,
      feedback: row.feedback ?? "",
      status: row.status,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/submissions/${editing}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        feedback: editForm.feedback || null,
      }),
    });
    if (res.ok) {
      setEditing(null);
      fetchSubmissions();
    }
  };

  const cancelEdit = () => {
    setEditing(null);
  };

  const onCsvSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCsvError("");
    setCsvSuccess("");
    const input = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setCsvError("Choose a file.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/admin/submissions/csv", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCsvSuccess(`Uploaded ${data.count ?? 0} row(s).`);
      fetchSubmissions();
      input.value = "";
    } else {
      setCsvError(data.error || "Upload failed.");
    }
  };

  if (loading) return <p className="text-navy/70">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-navy">CSV upload:</span>
        <form onSubmit={onCsvSubmit} className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept=".csv,.txt"
            className="text-sm text-navy/80"
          />
          <button
            type="submit"
            className="py-1.5 px-3 rounded-lg bg-navy text-white text-sm"
          >
            Upload
          </button>
        </form>
        {csvError && <p className="text-red-600 text-sm">{csvError}</p>}
        {csvSuccess && <p className="text-green-700 text-sm">{csvSuccess}</p>}
      </div>
      <p className="text-xs text-navy/60">
        CSV columns: user_id, service_date, service_type, credits, hours,
        feedback, status (optional)
      </p>

      <div className="overflow-x-auto -mx-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy/20 text-left text-navy/70">
              <th className="py-2 px-2">Student</th>
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Type</th>
              <th className="py-2 px-2">Hours</th>
              <th className="py-2 px-2">Credits</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-navy/10">
                {editing === row.id ? (
                  <>
                    <td colSpan={7} className="py-2 px-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="date"
                          value={editForm.service_date ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_date: e.target.value }))
                          }
                          className="px-2 py-1 border rounded text-navy"
                        />
                        <select
                          value={editForm.service_type ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_type: e.target.value }))
                          }
                          className="px-2 py-1 border rounded text-navy"
                        >
                          {SERVICE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.hours ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              hours: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="Hours"
                          className="w-20 px-2 py-1 border rounded text-navy"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.credits ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              credits: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="Credits"
                          className="w-20 px-2 py-1 border rounded text-navy"
                        />
                        <select
                          value={editForm.status ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, status: e.target.value }))
                          }
                          className="px-2 py-1 border rounded text-navy"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Denied">Denied</option>
                        </select>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="py-1 px-2 rounded bg-navy text-white text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="py-1 px-2 rounded border border-navy text-navy text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2">
                      {row.users
                        ? `${row.users.first_name} ${row.users.last_name}`
                        : row.user_id}
                    </td>
                    <td className="py-2 px-2">{row.service_date}</td>
                    <td className="py-2 px-2">{row.service_type}</td>
                    <td className="py-2 px-2">{Number(row.hours)}</td>
                    <td className="py-2 px-2">{Number(row.credits)}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          row.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : row.status === "Denied"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => startEdit(row)}
                        className="text-sky-blue text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="text-navy/70 text-sm">No submissions.</p>
      )}
    </div>
  );
}
