"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { FIELD_TYPES, FieldType } from "./types";
import { Type, Hash, AlignLeft, CheckSquare, List, Calendar } from "lucide-react";

// Map icon string names to components
const IconMap: Record<string, React.ComponentType<any>> = {
    Type,
    Hash,
    AlignLeft,
    CheckSquare,
    List,
    Calendar,
};

function ToolboxItem({ type, label, icon }: { type: FieldType; label: string; icon: string }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `toolbox-${type}`,
        data: {
            isToolboxItem: true,
            type,
        },
    });

    const Icon = IconMap[icon] || Type;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="flex items-center p-3 mb-2 bg-white border rounded cursor-grab hover:bg-slate-50 shadow-sm"
        >
            <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
            {/* Visual cue for dragging */}
        </div>
    );
}

export function Toolbox() {
    return (
        <div className="space-y-2">
            {FIELD_TYPES.map((field) => (
                <ToolboxItem key={field.type} {...field} />
            ))}
        </div>
    );
}
