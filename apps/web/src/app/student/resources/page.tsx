"use client";

import { useState, useEffect } from "react";
import { ResourceCard } from "@/components/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, RefreshCw } from "lucide-react";

export default function StudentResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchResources();
    }, []);

    async function fetchResources() {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch("/api/resources");
            const data = await res.json();
            if (data.resources) {
                setResources(data.resources);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resources</h1>
                <p className="text-muted-foreground text-sm md:text-base">Files and documents shared by your team.</p>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-16 border rounded-xl bg-muted/30">
                    <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3 text-red-500">
                        <AlertTriangle className="w-7 h-7" />
                    </div>
                    <h3 className="font-medium">Failed to load resources</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Please check your connection and try again.</p>
                    <Button variant="outline" size="sm" onClick={fetchResources}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            ) : resources.length === 0 ? (
                <div className="text-center py-16 border rounded-xl bg-muted/30">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium">No resources available</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        Your admin team hasn&apos;t uploaded any files yet.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resources.map((resource) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            isAdmin={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
