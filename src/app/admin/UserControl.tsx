"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
};

export function UserControl() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserRow>>({});
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");

  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "student",
  });
  const [addError, setAddError] = useState("");

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const phone10 = addForm.phone.replace(/\D/g, "");
    if (phone10.length !== 10) {
      setAddError("Phone must be 10 digits.");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...addForm, phone: phone10 }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setShowAdd(false);
      setAddForm({ first_name: "", last_name: "", phone: "", email: "", role: "student" });
      fetchUsers();
    } else {
      setAddError(data.error || "Failed to add user.");
    }
  };

  const startEdit = (row: UserRow) => {
    setEditing(row.id);
    setEditForm({
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      email: row.email,
      role: row.role,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`/api/admin/users/${editing}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditing(null);
      fetchUsers();
    }
  };

  const cancelEdit = () => setEditing(null);

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
    const res = await fetch("/api/admin/users/csv", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCsvSuccess(`Uploaded ${data.count ?? 0} row(s).`);
      fetchUsers();
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
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="glass-btn-primary py-1.5 px-4 text-sm"
          >
            Add user
          </button>
          <form onSubmit={onCsvSubmit} className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              accept=".csv,.txt"
              className="text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-accent/15 file:text-accent file:cursor-pointer hover:file:bg-accent/25 file:transition-colors"
            />
            <button
              type="submit"
              className="glass-btn-secondary py-1.5 px-4 text-sm"
            >
              CSV upload
            </button>
          </form>
        </div>
        {csvError && <p className="text-red-400 text-sm mt-2">{csvError}</p>}
        {csvSuccess && <p className="text-emerald-400 text-sm mt-2">{csvSuccess}</p>}
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          CSV columns: first_name, last_name, phone (10 digits), email, role
          (optional)
        </p>
      </div>

      {showAdd && (
        <form
          onSubmit={onAddSubmit}
          className="glass-card p-5 space-y-3"
        >
          <h3 className="font-medium text-[var(--text-primary)]/90">New user</h3>
          <input
            type="text"
            placeholder="First name"
            value={addForm.first_name}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, first_name: e.target.value }))
            }
            className="glass-input text-sm"
            required
          />
          <input
            type="text"
            placeholder="Last name"
            value={addForm.last_name}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, last_name: e.target.value }))
            }
            className="glass-input text-sm"
            required
          />
          <input
            type="tel"
            placeholder="10-digit phone"
            value={addForm.phone}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, phone: e.target.value }))
            }
            className="glass-input text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={addForm.email}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, email: e.target.value }))
            }
            className="glass-input text-sm"
            required
          />
          <select
            value={addForm.role}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, role: e.target.value }))
            }
            className="glass-input text-sm"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          {addError && <p className="text-red-400 text-sm">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="glass-btn-primary py-1.5 px-4 text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="glass-btn-secondary py-1.5 px-4 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="glass-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {editing === row.id ? (
                    <td colSpan={5} className="py-3 px-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          placeholder="First"
                          value={editForm.first_name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, first_name: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-24 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Last"
                          value={editForm.last_name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, last_name: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-24 text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={editForm.phone ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, phone: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-28 text-sm"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={editForm.email ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, email: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 min-w-[140px] text-sm"
                        />
                        <select
                          value={editForm.role ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, role: e.target.value }))
                          }
                          className="glass-input py-1.5 px-2 w-auto text-sm"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
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
                        {row.first_name} {row.last_name}
                      </td>
                      <td>{row.phone}</td>
                      <td>{row.email}</td>
                      <td className="capitalize">{row.role}</td>
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
      {rows.length === 0 && <p className="text-[var(--text-tertiary)] text-sm">No users.</p>}
    </div>
  );
}
