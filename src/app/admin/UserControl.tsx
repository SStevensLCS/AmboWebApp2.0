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

  if (loading) return <p className="text-navy/70">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="py-1.5 px-3 rounded-lg bg-navy text-white text-sm"
        >
          Add user
        </button>
        <form onSubmit={onCsvSubmit} className="flex items-center gap-2 flex-wrap">
          <input type="file" accept=".csv,.txt" className="text-sm text-navy/80" />
          <button type="submit" className="py-1.5 px-3 rounded-lg bg-navy text-white text-sm">
            CSV upload
          </button>
        </form>
        {csvError && <p className="text-red-600 text-sm">{csvError}</p>}
        {csvSuccess && <p className="text-green-700 text-sm">{csvSuccess}</p>}
      </div>
      <p className="text-xs text-navy/60">
        CSV columns: first_name, last_name, phone (10 digits), email, role
        (optional)
      </p>

      {showAdd && (
        <form
          onSubmit={onAddSubmit}
          className="p-4 rounded-lg border border-navy/20 space-y-2"
        >
          <h3 className="font-medium text-navy">New user</h3>
          <input
            type="text"
            placeholder="First name"
            value={addForm.first_name}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, first_name: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded text-navy text-sm"
            required
          />
          <input
            type="text"
            placeholder="Last name"
            value={addForm.last_name}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, last_name: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded text-navy text-sm"
            required
          />
          <input
            type="tel"
            placeholder="10-digit phone"
            value={addForm.phone}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, phone: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded text-navy text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={addForm.email}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, email: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded text-navy text-sm"
            required
          />
          <select
            value={addForm.role}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, role: e.target.value }))
            }
            className="w-full px-3 py-2 border rounded text-navy text-sm"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="py-1.5 px-3 rounded bg-navy text-white text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="py-1.5 px-3 rounded border border-navy text-navy text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto -mx-4">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-navy/20 text-left text-navy/70">
              <th className="py-2 px-2">Name</th>
              <th className="py-2 px-2">Phone</th>
              <th className="py-2 px-2">Email</th>
              <th className="py-2 px-2">Role</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-navy/10">
                {editing === row.id ? (
                  <>
                    <td colSpan={5} className="py-2 px-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          placeholder="First"
                          value={editForm.first_name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, first_name: e.target.value }))
                          }
                          className="w-24 px-2 py-1 border rounded text-navy"
                        />
                        <input
                          type="text"
                          placeholder="Last"
                          value={editForm.last_name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, last_name: e.target.value }))
                          }
                          className="w-24 px-2 py-1 border rounded text-navy"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={editForm.phone ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, phone: e.target.value }))
                          }
                          className="w-28 px-2 py-1 border rounded text-navy"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={editForm.email ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, email: e.target.value }))
                          }
                          className="min-w-[140px] px-2 py-1 border rounded text-navy"
                        />
                        <select
                          value={editForm.role ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, role: e.target.value }))
                          }
                          className="px-2 py-1 border rounded text-navy"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
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
                      {row.first_name} {row.last_name}
                    </td>
                    <td className="py-2 px-2">{row.phone}</td>
                    <td className="py-2 px-2">{row.email}</td>
                    <td className="py-2 px-2">{row.role}</td>
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
      {rows.length === 0 && <p className="text-navy/70 text-sm">No users.</p>}
    </div>
  );
}
