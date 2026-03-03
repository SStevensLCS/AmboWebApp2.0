"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { ResourceCard } from "@/components/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Loader2, FileText } from "lucide-react";


export default function AdminResourcesPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [open, setOpen] = useState(false);

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

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setUploading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch("/api/resources", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            await fetchResources();
            setOpen(false);
            toast.success("File uploaded successfully");
        } catch (error) {
            console.error("Upload error", error);
            toast.error("Upload failed", {
                description: "Please check the file and try again.",
            });
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this resource?")) return;

        try {
            const res = await fetch(`/api/resources/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");

            setResources(prev => prev.filter(r => r.id !== id));
            toast.success("Resource deleted");
        } catch (error) {
            console.error("Delete error", error);
            toast.error("Failed to delete resource");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resources</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Manage files accessible to all users.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="self-start sm:self-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Upload File
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Resource</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" name="title" required placeholder="e.g. Student Handbook" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input id="description" name="description" placeholder="Brief description of the file" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">File</Label>
                                <Input id="file" name="file" type="file" required />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={uploading}>
                                    {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Upload
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : resources.length === 0 ? (
                <div className="text-center py-16 border rounded-xl bg-muted/30">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium">No resources yet</h3>
                    <p className="text-muted-foreground text-sm mt-1 mb-4">
                        Upload files for your team to access.
                    </p>
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload First File
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {resources.map((resource) => (
                        <ResourceCard
                            key={resource.id}
                            resource={resource}
                            isAdmin={true}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
