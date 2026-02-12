"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Loader2 } from "lucide-react";

type Comment = {
    id: string;
    content: string;
    created_at: string;
    users: {
        first_name: string;
        last_name: string;
    };
};

type Post = {
    id: string;
    content: string;
    created_at: string;
    users: {
        first_name: string;
        last_name: string;
    };
    comments: { count: number }[];
};

export function PostItem({ post, currentUserId }: { post: Post; currentUserId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [commentCount, setCommentCount] = useState(post.comments?.[0]?.count || 0);

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

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(post.users?.first_name, post.users?.last_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">
                                {post.users?.first_name} {post.users?.last_name}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {post.content}
                        </p>
                    </div>
                </div>
            </CardContent>

            <Separator />

            <CardFooter className="p-2 justify-start">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleComments}
                    className="text-muted-foreground hover:text-foreground w-full sm:w-auto justify-start"
                >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {commentCount > 0 ? `${commentCount} Comments` : "Comment"}
                </Button>
            </CardFooter>

            {showComments && (
                <div className="bg-muted/30 p-4 pt-2 border-t rounded-b-xl animate-in slide-in-from-top-2 duration-200">
                    {loadingComments ? (
                        <div className="text-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {comments.length > 0 && (
                                <div className="space-y-4 mb-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="h-6 w-6 mt-1">
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                    {getInitials(comment.users?.first_name, comment.users?.last_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-sm font-medium">
                                                        {comment.users?.first_name} {comment.users?.last_name}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(comment.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {comment.content}
                                                </p>
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
            )}
        </Card>
    );
}
