"use client";

import { useState, useEffect } from "react";
import { ResourceCard } from "@/components/ResourceCard";
import { Loader2 } from "lucide-react";

export default function StudentResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResources();
    }, []);

    async function fetchResources() {
        try {
            const res = await fetch("/api/resources");
            const data = await res.json();
            if (data.resources) {
                setResources(data.resources);
            }
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
                <p className="text-muted-foreground">Download useful documents and files.</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : resources.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">No resources found.</p>
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
