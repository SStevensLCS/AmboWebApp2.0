"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { User } from "./types";

interface CreateGroupDialogProps {
    onGroupCreated: (groupId: string, groupData: { name: string | null; created_by: string; created_at: string; participants: User[] }) => void;
}

export function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [search, setSearch] = useState("");

    // Fetch users when dialog opens
    useEffect(() => {
        if (!open) return;
        const fetchUsers = async () => {
            setUsersLoading(true);
            try {
                const res = await fetch("/api/chat/users");
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setUsersLoading(false);
            }
        };
        fetchUsers();
    }, [open]);

    // Reset state when dialog closes
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setName("");
            setSelectedUsers([]);
            setSearch("");
            setUsers([]);
        }
    };

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
                handleOpenChange(false);
                onGroupCreated(data.group.id, {
                    name: data.group.name,
                    created_by: data.group.created_by,
                    created_at: data.group.created_at,
                    participants: selectedUsers,
                });
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create group");
            }
        } catch (error) {
            console.error("Failed to create group", error);
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen(true);
                }}
            >
                <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Select people to start a new conversation with.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
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

                        {/* Search input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="pl-9"
                            />
                        </div>

                        {/* Selected user badges */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedUsers.map(user => (
                                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1 pr-1">
                                        {user.first_name} {user.last_name}
                                        <button
                                            type="button"
                                            onClick={() => toggleUser(user)}
                                            className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                                            aria-label={`Remove ${user.first_name} ${user.last_name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Scrollable user list */}
                        <div className="border rounded-lg max-h-[280px] overflow-y-auto">
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

                    <div className="flex justify-end">
                        <Button onClick={handleCreate} disabled={loading || selectedUsers.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Group
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
