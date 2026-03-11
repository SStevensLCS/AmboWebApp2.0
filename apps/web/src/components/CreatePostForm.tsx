"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreatePostForm({ backPath }: { backPath: string }) {
    const router = useRouter();
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!content.trim() || submitting) return;
        setSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                toast.success("Post created");
                router.push(backPath);
            } else {
                setError(data.error || "Failed to create post.");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setSubmitting(false);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardContent className="p-4 pt-4 space-y-4">
                    <Textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (error) setError("");
                        }}
                        placeholder="Share something with the team..."
                        className="min-h-[160px] resize-none"
                        autoFocus
                    />
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => router.push(backPath)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!content.trim() || submitting}
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? "Posting..." : "Post"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
