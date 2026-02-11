"use client";

import { useState, useEffect } from "react";

type EventDetails = {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    type: string;
    created_by: string;
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

    // Fetch all data via server-side API
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
        new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });

    const going = rsvps.filter((r) => r.status === "going");
    const maybe = rsvps.filter((r) => r.status === "maybe");
    const myRsvp = rsvps.find(r => r.user_id === currentUserId)?.status;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 animate-fade-in">
            <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative bg-white shadow-lg">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                    ✕
                </button>

                <h2 className="text-2xl tracking-wide mb-1">{event.title}</h2>
                <div className="flex gap-3 text-sm text-[var(--text-secondary)] mb-4 flex-wrap">
                    <span>
                        {formatDate(event.start_time)}, {formatTime(event.start_time)} –{" "}
                        {formatTime(event.end_time)}
                    </span>
                    <span>·</span>
                    <span>{event.location}</span>
                </div>

                {event.description && (
                    <p className="text-[var(--text-secondary)] leading-relaxed mb-6">
                        {event.description}
                    </p>
                )}

                {/* RSVP */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm uppercase tracking-widest text-[var(--text-tertiary)]">
                            RSVP
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRsvp("going")}
                                disabled={loadingRsvp}
                                className={`py-1 px-3 text-xs rounded-md border transition-colors ${myRsvp === "going"
                                    ? "bg-[var(--text-primary)] text-white border-transparent"
                                    : "border-[var(--border)] hover:border-[var(--text-primary)]"
                                    }`}
                            >
                                Going
                            </button>
                            <button
                                onClick={() => handleRsvp("maybe")}
                                disabled={loadingRsvp}
                                className={`py-1 px-3 text-xs rounded-md border transition-colors ${myRsvp === "maybe"
                                    ? "bg-[var(--text-primary)] text-white border-transparent"
                                    : "border-[var(--border)] hover:border-[var(--text-primary)]"
                                    }`}
                            >
                                Maybe
                            </button>
                            <button
                                onClick={() => handleRsvp("no")}
                                disabled={loadingRsvp}
                                className={`py-1 px-3 text-xs rounded-md border transition-colors ${myRsvp === "no"
                                    ? "bg-red-500 text-white border-transparent"
                                    : "border-[var(--border)] text-red-500 hover:border-red-500"
                                    }`}
                            >
                                No
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                        <p className="mb-1">
                            Going ({going.length}){going.length > 0 && ": "}
                            {going.map((r) => `${r.users?.first_name || ""} ${r.users?.last_name || ""}`).map(n => n.trim()).filter(Boolean).join(", ")}
                        </p>
                        {maybe.length > 0 && (
                            <p>
                                Maybe ({maybe.length}):{" "}
                                {maybe.map((r) => `${r.users?.first_name || ""} ${r.users?.last_name || ""}`).map(n => n.trim()).filter(Boolean).join(", ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                    <h3 className="text-sm uppercase tracking-widest text-[var(--text-tertiary)]">
                        Comments
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {comments.map((c) => (
                            <div key={c.id} className="glass-card p-3">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-sm">
                                        {c.users?.first_name} {c.users?.last_name}
                                    </span>
                                    <span className="text-xs text-[var(--text-tertiary)]">
                                        {new Date(c.created_at).toLocaleTimeString([], {
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <p className="text-[var(--text-tertiary)] text-sm">No comments yet.</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="glass-input text-sm"
                            onKeyDown={(e) => e.key === "Enter" && postComment()}
                            disabled={loadingComment}
                        />
                        <button
                            onClick={postComment}
                            disabled={loadingComment || !newComment.trim()}
                            className="glass-btn-primary py-2 px-4 text-sm"
                        >
                            {loadingComment ? "..." : "Post"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
