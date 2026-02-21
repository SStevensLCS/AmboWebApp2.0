"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MotionButton } from "@/components/ui/motion-button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2, Pencil, Trash2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Comment = {
    id: string;
    content: string;
    created_at: string;
    user_id?: string;
    users: {
        first_name: string;
        last_name: string;
        role?: string;
        avatar_url?: string;
    };
};

type Post = {
    id: string;
    content: string;
    created_at: string;
    user_id?: string;
    users: {
        first_name: string;
        last_name: string;
        role?: string;
        avatar_url?: string;
    };
    comments: { count: number }[];
};

export function PostItem({ post, currentUserId, currentUserRole }: { post: Post; currentUserId: string; currentUserRole: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    // Post UI
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isDeleted, setIsDeleted] = useState(false);

    // Comment UI
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comments?.[0]?.count || 0);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentContent, setEditCommentContent] = useState("");

    // Permission Logic
    const isMyPost = currentUserId === post.user_id;
    const isSuperAdmin = currentUserRole === "superadmin";
    const isAdmin = currentUserRole === "admin";
    const postOwnerRole = post.users.role || "student"; // Default to student if missing

    const canEditPost = isMyPost || isSuperAdmin || (isAdmin && postOwnerRole === "student");

    // Comment Permission Logic Helper
    const canEditComment = (comment: Comment) => {
        const isMyComment = currentUserId === comment.user_id;
        const commentOwnerRole = comment.users.role || "student";
        return isMyComment || isSuperAdmin || (isAdmin && commentOwnerRole === "student");
    };

    if (isDeleted) return null;

    const handleDeletePost = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
        if (res.ok) {
            setIsDeleted(true);
        } else {
            const data = await res.json();
            alert(data.error || "Failed to delete post");
        }
    };

    const handleUpdatePost = async () => {
        const res = await fetch(`/api/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editContent }),
        });
        if (res.ok) {
            setIsEditing(false);
        } else {
            alert("Failed to update post");
        }
    };

    const toggleComments = async () => {
        if (!showComments && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await fetch(`/api/posts/${post.id}/comments`);
                if (res.ok) {
                    const data = await res.json();
                    setComments(data.comments || []);
                }
            } catch (error) {
                console.error("Failed to load comments", error);
            }
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.comment) {
                    setComments([...comments, data.comment]);
                    setNewComment("");
                    setCommentCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error("Failed to post comment", error);
        }
        setSubmitting(false);
    };

    const deleteComment = async (commentId: string) => {
        if (!confirm("Delete comment?")) return;
        const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, { method: "DELETE" });
        if (res.ok) {
            setComments(comments.filter(c => c.id !== commentId));
            setCommentCount(prev => Math.max(0, prev - 1));
        } else {
            const data = await res.json();
            alert(data.error || "Failed to delete comment");
        }
    };

    const saveCommentEdit = async (commentId: string) => {
        const res = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
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

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            layout
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                            {post.users?.avatar_url && <AvatarImage src={post.users.avatar_url} className="object-cover" />}
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(post.users?.first_name, post.users?.last_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">
                                    {post.users?.first_name} {post.users?.last_name}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {canEditPost && (
                                        <div className="flex gap-1">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleUpdatePost} className="text-green-600 hover:text-green-700">
                                                        <Check className="h-3 w-3" />
                                                    </button>
                                                    <button onClick={() => setIsEditing(false)} className="text-muted-foreground hover:text-foreground">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-foreground">
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    <button onClick={handleDeletePost} className="text-muted-foreground hover:text-red-500">
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isEditing ? (
                                <Textarea
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    className="mt-2"
                                />
                            ) : (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {isEditing ? editContent : post.content}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>

                <Separator />

                <CardFooter className="p-2 justify-start">
                    <MotionButton
                        variant="ghost"
                        size="sm"
                        onClick={toggleComments}
                        className="text-muted-foreground hover:text-foreground w-full sm:w-auto justify-start"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {commentCount > 0 ? `${commentCount} Comments` : "Comment"}
                    </MotionButton>
                </CardFooter>

                <AnimatePresence>
                    {showComments && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-muted/30 p-4 pt-2 border-t rounded-b-xl">
                                {loadingComments ? (
                                    <div className="text-center py-4">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.length > 0 && (
                                            <div className="space-y-4 mb-4">
                                                {comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3 group">
                                                        <Avatar className="h-6 w-6 mt-1">
                                                            {comment.users?.avatar_url && <AvatarImage src={comment.users.avatar_url} className="object-cover" />}
                                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                                {getInitials(comment.users?.first_name, comment.users?.last_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-baseline justify-between">
                                                                <span className="text-sm font-medium">
                                                                    {comment.users?.first_name} {comment.users?.last_name}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-muted-foreground">
                                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                                    </span>
                                                                    {canEditComment(comment) && editingCommentId !== comment.id && (
                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => { setEditingCommentId(comment.id); setEditCommentContent(comment.content); }} className="text-muted-foreground hover:text-foreground">
                                                                                <Pencil className="h-3 w-3" />
                                                                            </button>
                                                                            <button onClick={() => deleteComment(comment.id)} className="text-muted-foreground hover:text-red-500">
                                                                                <X className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {editingCommentId === comment.id ? (
                                                                <div className="flex gap-2">
                                                                    <Input
                                                                        value={editCommentContent}
                                                                        onChange={e => setEditCommentContent(e.target.value)}
                                                                        className="h-7 text-sm"
                                                                    />
                                                                    <Button size="sm" onClick={() => saveCommentEdit(comment.id)} className="h-7 w-7 p-0">
                                                                        <Check className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="h-7 w-7 p-0">
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {comment.content}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {comments.length === 0 && (
                                            <p className="text-sm text-muted-foreground py-2 text-center italic">
                                                No comments yet. Start the conversation!
                                            </p>
                                        )}

                                        <div className="flex gap-2 items-center">
                                            <Avatar className="h-8 w-8 hidden sm:block">
                                                <AvatarFallback className="bg-muted text-muted-foreground">
                                                    Me
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 flex gap-2">
                                                <Input
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Write a comment..."
                                                    className="h-9"
                                                    onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                                                />
                                                <Button
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0"
                                                    onClick={handlePostComment}
                                                    disabled={!newComment.trim() || submitting}
                                                >
                                                    {submitting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Send className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </motion.div>
    );
}
