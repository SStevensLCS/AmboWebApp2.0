"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { SERVICE_TYPES } from "@ambo/database/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, AlertCircle, MoreHorizontal, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "Approved" ? "default" :
          status === "Denied" ? "destructive" : "secondary"
      }
      className={
        status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200" :
          status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200"
      }
    >
      {status}
    </Badge>
  );
}

export function SubmissionsControl() {
  const [rows, setRows] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<SubRow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editForm, setEditForm] = useState<Partial<SubRow>>({});
  const [csvError, setCsvError] = useState("");
  const [csvSuccess, setCsvSuccess] = useState("");
  const [uploading, setUploading] = useState(false);

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
    setEditingRow(row);
    setEditForm({
      service_date: row.service_date,
      service_type: row.service_type,
      credits: row.credits,
      hours: row.hours,
      feedback: row.feedback ?? "",
      status: row.status,
    });
    setEditDialogOpen(true);
  };

  const onEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    const res = await fetch(`/api/admin/submissions/${editingRow.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        feedback: editForm.feedback || null,
      }),
    });
    if (res.ok) {
      setEditDialogOpen(false);
      fetchSubmissions();
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
    setUploading(false);
  };

  const columns: ColumnDef<SubRow>[] = [
    {
      accessorKey: "users.last_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Student" />
      ),
      cell: ({ row }) => {
        const user = row.original.users;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {user ? `${user.first_name} ${user.last_name}` : row.original.user_id}
            </span>
            {user && <span className="text-xs text-muted-foreground">{user.email}</span>}
          </div>
        );
      },
    },
    {
      accessorKey: "service_date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
    },
    {
      accessorKey: "service_type",
      header: "Type",
    },
    {
      accessorKey: "hours",
      header: "Hours",
    },
    {
      accessorKey: "credits",
      header: "Credits",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status") as string} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
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
              <DropdownMenuItem onClick={() => startEdit(row.original)}>
                Edit Submission
              </DropdownMenuItem>
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
      {/* CSV Upload */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={onCsvSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input type="file" accept=".csv,.txt" className="flex-1" disabled={uploading} />
            <Button type="submit" variant="secondary" disabled={uploading} className="shrink-0">
              {uploading ? "Uploading..." : "CSV Upload"}
            </Button>
          </form>
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

      {/* Mobile Card List */}
      <div className="md:hidden space-y-2">
        {rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No submissions found.</p>
        ) : (
          rows.map((row) => (
            <Link key={row.id} href={`/admin/submissions/${row.id}`}>
              <div className="bg-white border rounded-lg p-3.5 flex items-center gap-3 active:bg-gray-50 hover:bg-gray-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {row.users
                        ? `${row.users.first_name} ${row.users.last_name}`
                        : row.user_id}
                    </span>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {row.service_type} &middot; {row.hours}h &middot; {row.service_date}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable columns={columns} data={rows} />
      </div>

      {/* Edit Dialog (desktop) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Submission</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editForm.service_date || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, service_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editForm.service_type}
                  onValueChange={(val) => setEditForm((f) => ({ ...f, service_type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.hours || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, hours: parseFloat(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Credits</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editForm.credits || ""}
                  onChange={(e) => setEditForm(f => ({ ...f, credits: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(val) => setEditForm((f) => ({ ...f, status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                value={editForm.feedback || ""}
                onChange={(e) => setEditForm(f => ({ ...f, feedback: e.target.value }))}
                placeholder="Optional feedback for the student"
              />
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
