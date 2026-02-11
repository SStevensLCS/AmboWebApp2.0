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

  if (loading)
    return (
      <div className="flex items-center gap-2 text-[var(--text-tertiary)] py-8">
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        Loading…
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">CSV upload:</span>
          <form onSubmit={onCsvSubmit} className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              accept=".csv,.txt"
              className="text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-accent/15 file:text-accent file:cursor-pointer hover:file:bg-accent/25 file:transition-colors"
            />
            <button
              type="submit"
              className="glass-btn-primary py-1.5 px-4 text-sm"
            >
              Upload
            </button>
          </form>
        </div>
        {csvError && <p className="text-red-400 text-sm mt-2">{csvError}</p>}
        {csvSuccess && <p className="text-emerald-400 text-sm mt-2">{csvSuccess}</p>}
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          CSV columns: user_id, service_date, service_type, credits, hours,
          feedback, status (optional)
        </p>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Date</th>
                <th>Type</th>
                <th>Hours</th>
                <th>Credits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {editing === row.id ? (
                    <td colSpan={7} className="py-3 px-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="date"
                          value={editForm.service_date ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_date: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-auto text-sm"
                        />
                        <select
                          value={editForm.service_type ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_type: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-auto text-sm"
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
                          className="glass-input py-1.5 px-2 w-20 text-sm"
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
                          className="glass-input py-1.5 px-2 w-20 text-sm"
                        />
                        <select
                          value={editForm.status ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, status: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-auto text-sm"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Denied">Denied</option>
                        </select>
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="glass-btn-primary py-1.5 px-3 text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="glass-btn-secondary py-1.5 px-3 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td>
                        {row.users
                          ? `${row.users.first_name} ${row.users.last_name}`
                          : row.user_id}
                      </td>
                      <td>{row.service_date}</td>
                      <td>{row.service_type}</td>
                      <td>{Number(row.hours)}</td>
                      <td>{Number(row.credits)}</td>
                      <td>
                        <span
                          className={
                            row.status === "Approved"
                              ? "badge-approved"
                              : row.status === "Denied"
                                ? "badge-denied"
                                : "badge-pending"
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="text-accent text-sm hover:text-accent/80 transition-colors"
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
      </div>
      {rows.length === 0 && (
        <p className="text-[var(--text-tertiary)] text-sm">No submissions.</p>
      )}
    </div>
  );
}
