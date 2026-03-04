"use client";

import { useState } from "react";
import { Settings, Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
    const [removeTarget, setRemoveTarget] = useState<string | null>(null);
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
                toast.success("Group renamed");
                onUpdate();
            } else {
                toast.error("Failed to rename group");
            }
        } catch (error) {
            console.error("Failed to rename group", error);
            toast.error("Failed to rename group");
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
                toast.success(`Added ${user.first_name}`);
                onUpdate();
            } else {
                toast.error("Failed to add participant");
            }
        } catch (error) {
            console.error("Failed to add participant", error);
            toast.error("Failed to add participant");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveParticipant = async () => {
        if (!removeTarget) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/groups/${group.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ removeParticipants: [removeTarget] }),
            });
            if (res.ok) {
                toast.success("Participant removed");
                setRemoveTarget(null);
                onUpdate();
            } else {
                toast.error("Failed to remove participant");
            }
        } catch (error) {
            console.error("Failed to remove participant", error);
            toast.error("Failed to remove participant");
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
                                            onClick={() => setRemoveTarget(p.user.id)}
                                            disabled={loading}
                                            aria-label={`Remove ${p.user.first_name}`}
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
            <ConfirmDialog
                open={!!removeTarget}
                onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
                title="Remove participant"
                description="This person will no longer be able to see or send messages in this group."
                confirmLabel="Remove"
                variant="destructive"
                loading={loading}
                onConfirm={handleRemoveParticipant}
            />
        </Dialog>
    );
}
