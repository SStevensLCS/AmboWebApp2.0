"use client";

import { useEffect, useState } from "react";
import { SERVICE_TYPES } from "@/lib/types";
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
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";

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
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> CSV Upload
          </CardTitle>
          <CardDescription>
            Bulk upload submissions. Columns: user_id, service_date, service_type, credits, hours, feedback, status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCsvSubmit} className="flex items-center gap-4">
            <Input type="file" accept=".csv,.txt" className="max-w-xs" disabled={uploading} />
            <Button type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
          {csvError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{csvError}</AlertDescription>
            </Alert>
          )}
          {csvSuccess && (
            <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>{csvSuccess}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {editing === row.id ? (
                  <>
                    <TableCell colSpan={7}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-sm font-medium w-32 truncate">
                          {row.users
                            ? `${row.users.first_name} ${row.users.last_name}`
                            : row.user_id}
                        </span>
                        <Input
                          type="date"
                          value={editForm.service_date ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_date: e.target.value }))
                          }
                          className="w-36 h-8"
                        />
                        <select // Using native select for simplicity in inline edit, or could leverage Select but it's bulkier
                          value={editForm.service_type ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, service_type: e.target.value }))
                          }
                          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[140px] h-8"
                        >
                          {SERVICE_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          step="0.1"
                          value={editForm.hours ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, hours: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-20 h-8"
                          placeholder="Hrs"
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={editForm.credits ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, credits: parseFloat(e.target.value) || 0 }))
                          }
                          className="w-20 h-8"
                          placeholder="Crd"
                        />
                        <select
                          value={editForm.status ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, status: e.target.value }))
                          }
                          className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-[110px] h-8"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Denied">Denied</option>
                        </select>
                        <Button size="sm" onClick={saveEdit} className="h-8 w-8 p-0" variant="default">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={cancelEdit} className="h-8 w-8 p-0" variant="ghost">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium">
                      {row.users
                        ? `${row.users.first_name} ${row.users.last_name}`
                        : row.user_id}
                    </TableCell>
                    <TableCell>{row.service_date}</TableCell>
                    <TableCell>{row.service_type}</TableCell>
                    <TableCell>{Number(row.hours)}</TableCell>
                    <TableCell>{Number(row.credits)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "Approved"
                            ? "default"
                            : row.status === "Denied"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          row.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200" :
                            row.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No submissions found.
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={editForm.service_date ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, service_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={editForm.service_type ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, service_type: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hours</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.hours ?? ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, hours: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Credits</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editForm.credits ?? ""}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, credits: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={editForm.status ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Denied">Denied</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={saveEdit} className="flex-1">Save</Button>
                  <Button onClick={cancelEdit} variant="outline" className="flex-1">Cancel</Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-semibold">
                    {row.users ? `${row.users.first_name} ${row.users.last_name}` : row.user_id}
                  </div>
                  <Badge
                    variant={
                      row.status === "Approved"
                        ? "default"
                        : row.status === "Denied"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      row.status === "Approved" ? "bg-green-100 text-green-800 border-green-200" :
                        row.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {row.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground">
                  <div>Date: <span className="text-foreground">{row.service_date}</span></div>
                  <div>Type: <span className="text-foreground">{row.service_type}</span></div>
                  <div>Hours: <span className="text-foreground">{Number(row.hours)}</span></div>
                  <div>Credits: <span className="text-foreground">{Number(row.credits)}</span></div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                    Edit Submission
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {rows.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm border rounded-lg bg-card">
            No submissions found.
          </div>
        )}
      </div>
    </div>
  );
}
