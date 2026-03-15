"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PostItem } from "./PostItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquarePlus, Plus, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";

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

type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export function PostsFeed({ currentUserId, currentUserRole, basePath }: { currentUserId: string; currentUserRole: string; basePath: string }) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const fetchPosts = useCallback(async (page = 1, append = false) => {
        setFetchError(false);
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await fetch(`/api/posts?page=${page}&limit=25`);
            if (res.ok) {
                const json = await res.json();
                const newPosts = json.data || json.posts || [];
                setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
                if (json.pagination) setPagination(json.pagination);
            } else {
                setFetchError(true);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
            setFetchError(true);
        }
        setLoading(false);
        setLoadingMore(false);
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const hasMore = pagination ? pagination.page < pagination.totalPages : false;

    return (
        <div className="relative">
            <div className="space-y-4 max-w-2xl mx-auto">
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
                        <Button variant="outline" size="sm" onClick={() => fetchPosts()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </div>
                ) : posts.length > 0 ? (
                    <>
                        {posts.map((post) => (
                            <PostItem key={post.id} post={post} currentUserId={currentUserId} currentUserRole={currentUserRole} />
                        ))}
                        {hasMore && (
                            <div className="text-center py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchPosts((pagination?.page || 1) + 1, true)}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load more"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
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

            <Link
                href={`${basePath}/new`}
                className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
                <Plus className="h-6 w-6" />
            </Link>
        </div>
    );
}
