"use client";

import { useEffect, useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Plus, UserPlus, Check, X, AlertCircle, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

  const [myRole, setMyRole] = useState<string>("student");

  // Add Form State
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    role: "student",
  });
  const [addError, setAddError] = useState("");

  // Edit Form State
  const [editForm, setEditForm] = useState<Partial<UserRow>>({});

  const fetchUsers = async () => {
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
      setAddDialogOpen(false);
      setAddForm({ first_name: "", last_name: "", phone: "", email: "", role: "student" });
      fetchUsers();
    } else {
      setAddError(data.error || "Failed to add user.");
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditDialogOpen(false);
      fetchUsers();
    }
  };

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      fetchUsers();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
    }
  };

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

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "first_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue("first_name")} {row.original.last_name}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.getValue("role") === "admin" ? "default" : "secondary"}>
          {row.getValue("role")}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => startEdit(user)}>
                Edit User
              </DropdownMenuItem>
              {(myRole === "superadmin" || (myRole === "admin" && user.role !== "admin" && user.role !== "superadmin")) && (
                <DropdownMenuItem onClick={() => deleteUser(user)} className="text-red-600">
                  Delete User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new student or admin manually.</DialogDescription>
              </DialogHeader>
              <form onSubmit={onAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={addForm.first_name}
                      onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={addForm.last_name}
                      onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    placeholder="10-digit Phone"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={addForm.role}
                    onValueChange={(val) => setAddForm((f) => ({ ...f, role: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {addError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{addError}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit">Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex-1 min-w-[200px]">
            <form onSubmit={onCsvSubmit} className="flex items-center gap-2 justify-end">
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

      <DataTable columns={columns} data={rows} />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editForm.first_name || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editForm.last_name || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editForm.email || ""}
                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(val) => setEditForm((f) => ({ ...f, role: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
