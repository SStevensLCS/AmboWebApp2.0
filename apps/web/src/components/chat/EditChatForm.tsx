"use client";

import { useState, useEffect, useRef } from "react";
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

interface EditChatFormProps {
    groupId: string;
    backPath: string;
}

export function EditChatForm({ groupId, backPath }: EditChatFormProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [search, setSearch] = useState("");
    // Track original state for computing delta
    const originalParticipantIds = useRef<Set<string>>(new Set());
    const originalName = useRef<string>("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [groupRes, usersRes] = await Promise.all([
                    fetch(`/api/chat/groups/${groupId}`),
                    fetch("/api/chat/users"),
                ]);

                if (groupRes.ok) {
                    const { group } = await groupRes.json();
                    setName(group.name || "");
                    originalName.current = group.name || "";
                    const participants: User[] = (group.participants || [])
                        .filter((p: { user: User }) => p.user)
                        .map((p: { user: User }) => p.user);
                    setSelectedUsers(participants);
                    originalParticipantIds.current = new Set(participants.map((u: User) => u.id));
                } else {
                    toast.error("Failed to load group");
                }

                if (usersRes.ok) {
                    const data = await usersRes.json();
                    setUsers(data.users || []);
                }
            } catch {
                toast.error("Failed to load data");
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [groupId]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const currentIds = new Set(selectedUsers.map(u => u.id));
            const addParticipants = selectedUsers
                .filter(u => !originalParticipantIds.current.has(u.id))
                .map(u => u.id);
            const removeParticipants = Array.from(originalParticipantIds.current)
                .filter(id => !currentIds.has(id));

            const body: Record<string, unknown> = {};
            if (name !== originalName.current) body.name = name;
            if (addParticipants.length > 0) body.addParticipants = addParticipants;
            if (removeParticipants.length > 0) body.removeParticipants = removeParticipants;

            if (Object.keys(body).length === 0) {
                router.push(`${backPath}?group=${groupId}`);
                return;
            }

            const res = await fetch(`/api/chat/groups/${groupId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                toast.success("Group updated");
                router.push(`${backPath}?group=${groupId}`);
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update group");
            }
        } catch {
            toast.error("Failed to update group");
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

    if (initialLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

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
                            {filteredUsers.length === 0 ? (
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
                        <Button variant="outline" onClick={() => router.push(`${backPath}?group=${groupId}`)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading || selectedUsers.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Group
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
