"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
    currentAvatarUrl: string | null;
    firstName: string;
    lastName: string;
}

export function AvatarUpload({ currentAvatarUrl, firstName, lastName }: AvatarUploadProps) {
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initials = `${(firstName || "?")[0]}${(lastName || "")[0] || ""}`.toUpperCase();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/users/avatar", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAvatarUrl(data.avatar_url);
            } else {
                const data = await res.json();
                alert(data.error || "Failed to upload avatar");
            }
        } catch {
            alert("Network error. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="relative">
                    <Avatar className="h-20 w-20">
                        {avatarUrl && <AvatarImage src={avatarUrl} className="object-cover" />}
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        {avatarUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG. Max 5MB.</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
