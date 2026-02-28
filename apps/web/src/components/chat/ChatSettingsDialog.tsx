"use client";

import { useState } from "react";
import { Settings, Trash2, UserPlus, Loader2 } from "lucide-react";
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
import { UserSearch } from "./UserSearch";
import { Group, User } from "./types";
import { useRouter } from "next/navigation";

interface ChatSettingsDialogProps {
    group: Group;
    currentUserId: string;
    onUpdate: () => void;
}

export function ChatSettingsDialog({
    group,
    currentUserId,
    onUpdate,
}: ChatSettingsDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(group.name || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRename = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/groups/${group.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error("Failed to rename group", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddParticipant = async (user: User) => {
        const userId = user.id;
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/groups/${group.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ addParticipants: [userId] }),
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error("Failed to add participant", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/groups/${group.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ removeParticipants: [userId] }),
            });
            if (res.ok) {
                onUpdate();
            }
        } catch (error) {
            console.error("Failed to remove participant", error);
        } finally {
            setLoading(false);
        }
    }

    // Determine if current user can remove others (e.g. admin or creator)
    // For simplicity, allowed for now if API permits. UI shows button.

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Chat Settings</DialogTitle>
                    <DialogDescription className="sr-only">
                        Manage settings for this chat group
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Group Name</Label>
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Group Name"
                            />
                            <Button onClick={handleRename} disabled={loading || name === group.name}>
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Participants</Label>
                        <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto space-y-2">
                            {group.participants?.filter(p => p.user).map((p) => (
                                <div key={p.user.id} className="flex items-center justify-between">
                                    <span className="text-sm">
                                        {p.user.first_name} {p.user.last_name}
                                    </span>
                                    {p.user.id !== currentUserId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => handleRemoveParticipant(p.user.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Add Participant</Label>
                        <UserSearch
                            selectedUsers={group.participants?.filter(p => p.user).map(p => p.user.id) || []}
                            onSelect={handleAddParticipant}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
