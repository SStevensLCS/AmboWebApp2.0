"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Shirt, Send, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";

type EventDetails = {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    type: string;
    created_by: string;
    uniform?: string;
    users?: { role?: string };
};

type Comment = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    users: { first_name: string; last_name: string; role?: string };
};

type RSVP = {
    status: string;
    users: { first_name: string; last_name: string };
    user_id: string;
};

export function EventModal({
    event,
    onClose,
    currentUserId,
    userRole,
}: {
    event: EventDetails;
    onClose: () => void;
    currentUserId: string;
    userRole: string; // "student", "admin", "superadmin"
}) {
    // Data State
    const [comments, setComments] = useState<Comment[]>([]);
    const [rsvps, setRsvps] = useState<RSVP[]>([]);

    // Permission Logic
    const isSuperAdmin = userRole === "superadmin";
    const isAdmin = userRole === "admin";

    // Event Permission:
    // Superadmin: All.
    // Admin: Can edit own events? Can edit other admin events?
    // Rule: "Admin ... can delete ... any student user and their own, but not other admin users."
    // Does this apply to events? "An Admin user should be able to delete or edit a post, event, comment... of any student user and their own, but not other admin users."
    // Events usually created by admins.
    // So if Event A created by Admin A. Admin B cannot edit/delete it.

    const eventCreatorRole = event.users?.role || "admin"; // Default to admin for events if unknown, as usually admins create them.
    const isMyEvent = event.created_by === currentUserId;

    // Admin can edit if: it's mine OR creator is student (unlikely for events) OR I am superadmin.
    // If creator is another admin, I cannot edit.

    const canEditEvent = isSuperAdmin || isMyEvent || (isAdmin && eventCreatorRole === "student");

    // Comment Permission:
    const canEditComment = (comment: Comment) => {
        const isMyComment = comment.user_id === currentUserId;
        const commentOwnerRole = comment.users?.role || "student";
        return isSuperAdmin || isMyComment || (isAdmin && commentOwnerRole === "student");
    };


    // UI State
    const [newComment, setNewComment] = useState("");
    const [loadingComment, setLoadingComment] = useState(false);
    const [loadingRsvp, setLoadingRsvp] = useState(false);

    // Edit Event State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<EventDetails>>({});
    const [saving, setSaving] = useState(false);

    // Edit Comment State
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentContent, setEditCommentContent] = useState("");


    const fetchData = async () => {
        try {
            const res = await fetch(`/api/events/comments?event_id=${event.id}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setRsvps(data.rsvps || []);
            }
        } catch (e) {
            console.error("Failed to fetch event data", e);
        }
    };

    const isDesktop = useMediaQuery("(min-width: 768px)");

    useEffect(() => {
        fetchData();
        setEditForm({
            title: event.title,
            description: event.description,
            location: event.location,
            uniform: event.uniform,
            start_time: event.start_time,
            end_time: event.end_time
        });
    }, [event.id]);

    // --- Comments Logic ---

    const postComment = async () => {
        if (!newComment.trim() || loadingComment) return;
        setLoadingComment(true);

        try {
            const res = await fetch("/api/events/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    content: newComment.trim(),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setNewComment("");
            }
        } catch (e) {
            console.error("Failed to post comment", e);
        }
        setLoadingComment(false);
    };

    const deleteComment = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        const res = await fetch(`/api/events/comments/${commentId}`, { method: "DELETE" });
        if (res.ok) {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    const startEditComment = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditCommentContent(comment.content);
    };

    const saveCommentEdit = async (commentId: string) => {
        const res = await fetch(`/api/events/comments/${commentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editCommentContent }),
        });
        if (res.ok) {
            const data = await res.json();
            setComments(comments.map(c => c.id === commentId ? { ...c, content: data.comment.content } : c));
            setEditingCommentId(null);
        }
    };

    // --- RSVP Logic ---

    const handleRsvp = async (status: string) => {
        if (loadingRsvp) return;
        setLoadingRsvp(true);

        try {
            const res = await fetch("/api/events/rsvp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    status,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setRsvps(data.rsvps || []);
            }
        } catch (e) {
            console.error("Failed to update RSVP", e);
        }
        setLoadingRsvp(false);
    };

    // --- Event Logic ---

    const handleSaveEvent = async () => {
        setSaving(true);
        const res = await fetch(`/api/events/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm),
        });

        if (res.ok) {
            window.location.reload(); // Refresh to see changes
        } else {
            alert("Failed to update event");
        }
        setSaving(false);
    };

    const handleDeleteEvent = async () => {
        if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) return;

        await fetch(`/api/events/${event.id}`, { method: "DELETE" });
        window.location.reload();
    };

    // --- Utilities ---

    const formatTime = (d: string) =>
        new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

    const going = rsvps.filter((r) => r.status === "going");
    const maybe = rsvps.filter((r) => r.status === "maybe");
    const myRsvp = rsvps.find(r => r.user_id === currentUserId)?.status;

    const rsvpButtons = [
        {
            status: "going",
            label: "Going",
            activeClass: "bg-green-600 hover:bg-green-700",
        },
        {
            status: "maybe",
            label: "Maybe",
            activeClass: "bg-amber-500 text-white hover:bg-amber-600",
        },
        {
            status: "no",
            label: "Can't go",
            activeClass: "",
        },
    ];

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
    };

    const Content = (
        <div className={cn("flex flex-col h-full", isDesktop ? "max-h-[85vh]" : "max-h-[85vh]")}>
            <div className="p-6 pb-4 border-b">
                <div className="flex items-start justify-between gap-4">
                    {isEditing ? (
                        <div className="w-full space-y-3">
                            <Input
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                className="text-lg font-bold"
                                placeholder="Event Title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="datetime-local"
                                    value={editForm.start_time ? new Date(editForm.start_time).toISOString().slice(0, 16) : ""}
                                    onChange={e => setEditForm({ ...editForm, start_time: new Date(e.target.value).toISOString() })}
                                />
                                <Input
                                    type="datetime-local"
                                    value={editForm.end_time ? new Date(editForm.end_time).toISOString().slice(0, 16) : ""}
                                    onChange={e => setEditForm({ ...editForm, end_time: new Date(e.target.value).toISOString() })}
                                />
                            </div>
                            <Input
                                value={editForm.location}
                                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                placeholder="Location"
                            />
                        </div>
                    ) : (
                        <div>
                            {isDesktop ? (
                                <DialogTitle className="text-xl">{event.title}</DialogTitle>
                            ) : (
                                <DrawerTitle className="text-xl text-left">{event.title}</DrawerTitle>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(event.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
                                </div>
                                {event.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        <span>{event.location}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {canEditEvent && (
                        <div className="flex gap-1 shrink-0">
                            {isEditing ? (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveEvent} disabled={saving}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setIsEditing(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={handleDeleteEvent}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 pb-20">
                    {isEditing ? (
                        <Textarea
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Description"
                            className="min-h-[100px]"
                        />
                    ) : (
                        event.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {event.description}
                            </p>
                        )
                    )}

                    {/* Uniform */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                        <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                            <Shirt className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Uniform</h4>
                            {isEditing ? (
                                <Input
                                    value={editForm.uniform}
                                    onChange={e => setEditForm({ ...editForm, uniform: e.target.value })}
                                    className="h-8 text-sm"
                                    placeholder="Uniform Requirements"
                                />
                            ) : (
                                <p className="text-sm text-blue-900 dark:text-blue-100">{event.uniform || "Ambassador Polo with Navy Pants."}</p>
                            )}
                        </div>
                    </div>

                    {/* RSVP Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">RSVP</h3>
                            <div className="flex gap-2">
                                {rsvpButtons.map((btn) => (
                                    <Button
                                        key={btn.status}
                                        variant={myRsvp === btn.status ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleRsvp(btn.status)}
                                        disabled={loadingRsvp}
                                        className={cn(
                                            "h-8 transition-colors",
                                            myRsvp === btn.status && btn.status === "going" && "bg-green-600 hover:bg-green-700 border-green-600 text-white",
                                            myRsvp === btn.status && btn.status === "maybe" && "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white",
                                            myRsvp !== btn.status && "text-muted-foreground"
                                        )}
                                    >
                                        {btn.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            {(going.length > 0 || maybe.length > 0) ? (
                                <div className="text-sm space-y-1">
                                    {going.length > 0 && (
                                        <p>
                                            <span className="font-medium text-foreground">Going ({going.length}): </span>
                                            <span className="text-muted-foreground">
                                                {going.map((r) => `${r.users?.first_name || ""} ${r.users?.last_name || ""}`).map(n => n.trim()).filter(Boolean).join(", ")}
                                            </span>
                                        </p>
                                    )}
                                    {maybe.length > 0 && (
                                        <p>
                                            <span className="font-medium text-foreground">Maybe ({maybe.length}): </span>
                                            <span className="text-muted-foreground">
                                                {maybe.map((r) => `${r.users?.first_name || ""} ${r.users?.last_name || ""}`).map(n => n.trim()).filter(Boolean).join(", ")}
                                            </span>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No RSVPs yet.</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Comments ({comments.length})
                        </h3>

                        <div className="space-y-4">
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-3 group">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {getInitials(c.users?.first_name, c.users?.last_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-sm font-medium">
                                                {c.users?.first_name} {c.users?.last_name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(c.created_at).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                {(canEditComment(c)) && editingCommentId !== c.id && (
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEditComment(c)} className="text-muted-foreground hover:text-foreground">
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                        <button onClick={() => deleteComment(c.id)} className="text-muted-foreground hover:text-red-500">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {editingCommentId === c.id ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    value={editCommentContent}
                                                    onChange={e => setEditCommentContent(e.target.value)}
                                                    className="h-8 text-sm"
                                                />
                                                <Button size="sm" onClick={() => saveCommentEdit(c.id)} className="h-8 w-8 p-0">
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-8 w-8 p-0">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">{c.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Footer Input */}
            <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
                <form
                    onSubmit={(e) => { e.preventDefault(); postComment(); }}
                    className="flex gap-2"
                >
                    <Input
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={loadingComment}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={loadingComment || !newComment.trim()}
                    >
                        {loadingComment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
                    {Content}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="h-[95vh] rounded-t-[20px]">
                {/* Visual handle is already in DrawerContent */}
                {Content}
            </DrawerContent>
        </Drawer>
    );
}
