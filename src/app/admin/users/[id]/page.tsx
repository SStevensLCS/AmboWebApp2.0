"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  role: string;
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<Partial<UserRow>>({});

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setForm({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          email: data.email,
          role: data.role,
        });
      })
      .catch(() => setError("Failed to load user."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Refresh local state with saved values
      setUser((prev) => prev ? { ...prev, ...form } as UserRow : prev);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Save failed.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">User not found.</p>
        <Button asChild variant="outline">
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold leading-tight">
            {user.first_name} {user.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant={user.role === "admin" || user.role === "superadmin" ? "default" : "secondary"} className="ml-auto">
          {user.role}
        </Badge>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSave} className="space-y-4 bg-white border rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input
              value={form.first_name || ""}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input
              value={form.last_name || ""}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={form.role}
            onValueChange={(val) => setForm((f) => ({ ...f, role: val }))}
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {saved && <p className="text-sm text-green-600">Changes saved.</p>}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}
