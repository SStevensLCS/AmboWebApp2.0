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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Shirt, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

type Comment = {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    users: { first_name: string; last_name: string };
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
    userRole: string;
}) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [rsvps, setRsvps] = useState<RSVP[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loadingComment, setLoadingComment] = useState(false);
    const [loadingRsvp, setLoadingRsvp] = useState(false);

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

    useEffect(() => {
        fetchData();
    }, [event.id]);

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
            variant: "default" as const,
            activeClass: "bg-green-600 hover:bg-green-700",
        },
        {
            status: "maybe",
            label: "Maybe",
            variant: "secondary" as const,
            activeClass: "bg-amber-500 text-white hover:bg-amber-600",
        },
        {
            status: "no",
            label: "Can't go",
            variant: "destructive" as const,
            activeClass: "",
        },
    ];

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="text-xl">{event.title}</DialogTitle>
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
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {event.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {event.description}
                            </p>
                        )}

                        {/* Uniform */}
                        <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
                            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                                <Shirt className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Uniform</h4>
                                <p className="text-sm text-blue-900 dark:text-blue-100">{event.uniform || "Ambassador Polo with Navy Pants."}</p>
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
                                    <div key={c.id} className="flex gap-3">
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
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(c.created_at).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{c.content}</p>
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
                <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            </DialogContent>
        </Dialog>
    );
}
