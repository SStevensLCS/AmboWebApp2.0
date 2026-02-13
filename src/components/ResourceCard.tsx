"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Trash2, File as FileIcon, Image as ImageIcon } from "lucide-react";
import { formatBytes } from "@/lib/utils"; // Assuming this helper exists, or I wll implement inline

interface Resource {
    id: string;
    title: string;
    description?: string;
    file_url: string;
    file_type: string;
    file_size: number;
    created_at: string;
    publicUrl: string;
}

interface ResourceCardProps {
    resource: Resource;
    isAdmin?: boolean;
    onDelete?: (id: string) => void;
}

export function ResourceCard({ resource, isAdmin, onDelete }: ResourceCardProps) {
    const isImage = resource.file_type.startsWith("image/");
    const isPdf = resource.file_type === "application/pdf";

    const Icon = isImage ? ImageIcon : isPdf ? FileText : FileIcon;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="flex-row gap-4 items-start space-y-0 pb-2">
                <div className="p-2 bg-muted rounded-md">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate" title={resource.title}>
                        {resource.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                        {(resource.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(resource.created_at).toLocaleDateString()}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 text-sm text-muted-foreground pb-2">
                {resource.description || "No description provided."}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" asChild>
                    <a href={resource.publicUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </a>
                </Button>
                {isAdmin && onDelete && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => onDelete(resource.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
