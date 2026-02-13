"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "./types";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface SortableFieldProps {
    field: FormField;
    isSelected: boolean;
    onSelect: (e: React.MouseEvent) => void;
}

export function SortableField({ field, isSelected, onSelect }: SortableFieldProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Render dummy input based on type for preview
    const renderInput = () => {
        switch (field.type) {
            case "textarea":
                return <Textarea placeholder={field.placeholder} disabled className="resize-none" />;
            case "select":
                return (
                    <Select disabled>
                        <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                    </Select>
                );
            case "checkbox":
                return <div className="flex items-center space-x-2"><Checkbox disabled /><label>Checkbox</label></div>;
            default:
                return <Input type={field.type === "number" ? "number" : "text"} placeholder={field.placeholder} disabled />;
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={cn(
                "relative p-4 border transition-all cursor-pointer group hover:border-primary/50",
                isSelected ? "border-primary ring-1 ring-primary" : "border-slate-200",
                isDragging ? "opacity-50" : "opacity-100"
            )}
        >
            <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" {...listeners} {...attributes}>
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="pl-6 pointer-events-none">
                <Label className="block mb-2 text-sm font-medium">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderInput()}
            </div>
        </Card>
    );
}
