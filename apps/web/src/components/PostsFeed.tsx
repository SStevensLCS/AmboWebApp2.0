"use client";

import { useState, useEffect } from "react";
import { PostItem } from "./PostItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquarePlus, PenLine, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";

type Post = {
    id: string;
    content: string;
    created_at: string;
    users: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    };
    comments: { count: number }[];
};

export function PostsFeed({ currentUserId, currentUserRole }: { currentUserId: string; currentUserRole: string }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [fetchError, setFetchError] = useState(false);

    const fetchPosts = async () => {
        setFetchError(false);
        try {
            const res = await fetch("/api/posts");
            if (res.ok) {
                const data = await res.json();
                setPosts(data.posts || []);
            } else {
                setFetchError(true);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            setFetchError(true);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async () => {
        if (!newPost.trim() || submitting) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newPost }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                if (data.post) {
                    setPosts([data.post, ...posts]);
                    setNewPost("");
                }
            } else {
                setError(data.error || "Failed to create post.");
            }
        } catch (error) {
            console.error("Failed to create post", error);
            setError("Network error. Please try again.");
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Create Post Input */}
            <Card>
                <CardContent className="p-4 pt-4">
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <PenLine className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <Textarea
                                value={newPost}
                                onChange={(e) => {
                                    setNewPost(e.target.value);
                                    if (error) setError("");
                                }}
                                placeholder="Share something with the team..."
                                className="min-h-[100px] resize-none"
                            />
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={!newPost.trim() || submitting}
                                >
                                    {submitting ? "Posting..." : "Post Update"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-[150px]" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-4/5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : fetchError ? (
                    <div className="text-center py-12 border rounded-xl bg-muted/30">
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3 text-red-500">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <h3 className="font-medium">Failed to load posts</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">Please check your connection and try again.</p>
                        <Button variant="outline" size="sm" onClick={fetchPosts}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <PostItem key={post.id} post={post} currentUserId={currentUserId} currentUserRole={currentUserRole} />
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                            <MessageSquarePlus className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium">No posts yet</h3>
                        <p className="text-muted-foreground">Be the first to share something!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
