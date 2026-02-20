"use client";

import { useState } from "react";
import { Plus, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "./types";
import { UserSearch } from "./UserSearch";
import { Badge } from "@/components/ui/badge";

interface CreateGroupDialogProps {
    onGroupCreated: (groupId: string) => void;
}

export function CreateGroupDialog({ onGroupCreated }: CreateGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

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
                setOpen(false);
                setName("");
                setSelectedUsers([]);
                onGroupCreated(data.group.id);
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Chat
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Select a user to start a new chat conversion with.
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
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedUsers.length > 0 && selectedUsers.map(user => (
                                <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                    {user.first_name} {user.last_name}
                                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleUser(user)} />
                                </Badge>
                            ))}
                        </div>
                        <UserSearch
                            selectedUsers={selectedUsers.map(u => u.id)}
                            onSelect={toggleUser}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Select users to start a conversation.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleCreate} disabled={loading || selectedUsers.length === 0}>
                            Create Group
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
