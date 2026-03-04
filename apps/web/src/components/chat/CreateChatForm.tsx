"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { User } from "./types";

export function CreateChatForm({ backPath }: { backPath: string }) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch("/api/chat/users");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
                toast.error("Failed to load users");
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/chat/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, participants: selectedUsers.map(u => u.id) }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success("Chat created");
                router.push(`${backPath}?group=${data.group.id}`);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create group");
            }
        } catch {
            toast.error("Failed to create group");
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (user: User) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const isSelected = (userId: string) => selectedUsers.some(u => u.id === userId);

    const filteredUsers = users.filter((user) => {
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const searchLower = search.toLowerCase();
        return fullName.includes(searchLower) || email.includes(searchLower);
    });

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Card>
                <CardContent className="p-4 pt-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Group Name (Optional)</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project Team"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Participants</Label>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-9"
                            />
                        </div>

                        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                            {usersLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    {users.length === 0 ? "No users available." : "No users found."}
                                </div>
                            ) : (
                                <div className="p-1">
                                    {filteredUsers.map((user) => {
                                        const selected = isSelected(user.id);
                                        const initials = `${(user.first_name || "?")[0]}${(user.last_name || "")[0] || ""}`.toUpperCase();
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleUser(user)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-left",
                                                    selected
                                                        ? "bg-primary/10"
                                                        : "hover:bg-accent"
                                                )}
                                            >
                                                <Avatar className="h-8 w-8 shrink-0">
                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">
                                                            {user.first_name} {user.last_name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        {user.email}
                                                    </span>
                                                </div>
                                                {selected && (
                                                    <Check className="h-4 w-4 text-primary shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => router.push(backPath)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={loading || selectedUsers.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Group
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
