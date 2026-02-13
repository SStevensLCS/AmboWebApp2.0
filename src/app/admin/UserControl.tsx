"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Plus, UserPlus, Check, X, AlertCircle } from "lucide-react";

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
  const [uploading, setUploading] = useState(false);

  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "student",
  });
  const [addError, setAddError] = useState("");

  const [myRole, setMyRole] = useState<string>("student");

  const fetchUsers = async () => {
    // We can also fetch "me" here to get my role if not passed as prop.
    // Or we rely on parent. But UserControl is a page component usually? 
    // Actually it's imported in page.tsx. 
    // Let's assume we can fetch /api/auth/me or similar, or just check the list for myself?
    // Better to fetch session.
    // For now, let's validte permissions via API error handling, but UI should hide buttons if known.
    // I'll add a quick fetch for session or rely on API failures for strict security.
    // But user wants UI to reflect it? "Student users should only be able to..."

    // Let's fetch /api/auth/session if available, or just /api/users/me
    const meRes = await fetch("/api/auth/session");
    if (meRes.ok) {
      const session = await meRes.json();
      setMyRole(session.user?.role || "student");
    }

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
    setUploading(true);

    const input = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      setCsvError("Choose a file.");
      setUploading(false);
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
    setUploading(false);
  };

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
    }
  };

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {showAdd ? "Close Form" : "Add User"}
          </Button>

          <div className="flex-1 min-w-[200px]">
            <form onSubmit={onCsvSubmit} className="flex items-center gap-2">
              <Input type="file" accept=".csv,.txt" className="max-w-[250px]" disabled={uploading} />
              <Button type="submit" variant="secondary" disabled={uploading}>
                {uploading ? "Uploading..." : "CSV Upload"}
              </Button>
            </form>
          </div>
        </CardContent>
        {(csvError || csvSuccess) && (
          <CardFooter className="pt-0 pb-4 block">
            {csvError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{csvError}</AlertDescription>
              </Alert>
            )}
            {csvSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription>{csvSuccess}</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Add User Form */}
      {showAdd && (
        <Card className="animate-in slide-in-from-top-4 fade-in duration-200">
          <CardHeader>
            <CardTitle>New User</CardTitle>
            <CardDescription>Add a new student or admin manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={addForm.first_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Last Name"
                  value={addForm.last_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="tel"
                  placeholder="10-digit Phone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>

              {addError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{addError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit">Add User</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {editing === row.id ? (
                  <>
                    <TableCell colSpan={5}>
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          placeholder="First"
                          value={editForm.first_name ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                          className="w-24 h-8"
                        />
                        <Input
                          placeholder="Last"
                          value={editForm.last_name ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                          className="w-24 h-8"
                        />
                        <Input
                          placeholder="Phone"
                          value={editForm.phone ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          className="w-28 h-8"
                        />
                        <Input
                          placeholder="Email"
                          value={editForm.email ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          className="min-w-[140px] h-8"
                        />
                        <select
                          value={editForm.role ?? ""}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                          className="h-8 w-[100px] border rounded-md text-sm px-2"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={cancelEdit} variant="ghost" className="h-8 w-8 p-0">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium">
                      {row.first_name} {row.last_name}
                    </TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Badge variant={row.role === "admin" ? "default" : "secondary"}>
                        {row.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                          Edit
                        </Button>
                        {(myRole === "superadmin" || (myRole === "admin" && row.role !== "admin" && row.role !== "superadmin")) && (
                          <Button variant="ghost" size="sm" onClick={() => deleteUser(row)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile Feed */}
      <div className="sm:hidden space-y-4">
        {rows.map((row) => (
          <Card key={row.id}>
            {editing === row.id ? (
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First"
                    value={editForm.first_name ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                  />
                  <Input
                    placeholder="Last"
                    value={editForm.last_name ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Phone"
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  value={editForm.email ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
                <select
                  value={editForm.role ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={saveEdit} className="flex-1">Save</Button>
                  <Button onClick={cancelEdit} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">
                    {row.first_name} {row.last_name}
                  </div>
                  <Badge variant={row.role === "admin" ? "default" : "secondary"}>
                    {row.role}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-y-1 text-sm text-muted-foreground mb-4">
                  <div>{row.phone}</div>
                  <div className="truncate">{row.email}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                    Edit
                  </Button>
                  {(myRole === "superadmin" || (myRole === "admin" && row.role !== "admin" && row.role !== "superadmin")) && (
                    <Button variant="outline" size="sm" onClick={() => deleteUser(row)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm border rounded-lg bg-card">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
