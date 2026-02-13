"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FormField } from "./types";
import { SortableField } from "./SortableField";
import { cn } from "@/lib/utils";

interface CanvasProps {
    fields: FormField[];
    selectedFieldId: string | null;
    onFieldSelect: (id: string | null) => void;
    setFields: React.Dispatch<React.SetStateAction<FormField[]>>;
}

export function Canvas({ fields, selectedFieldId, onFieldSelect }: CanvasProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: "canvas-droppable",
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-[375px] h-full bg-white border-2 border-dashed rounded-lg transition-colors p-4 overflow-y-auto relative shadow-sm",
                isOver ? "border-primary bg-blue-50/50" : "border-slate-300"
            )}
            onClick={() => onFieldSelect(null)} // Deselect when clicking empty space
        >
            {fields.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                    <p className="text-center text-sm">
                        Drag fields here from the toolbox.<br />
                        (Mobile View Preview)
                    </p>
                </div>
            )}

            <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                    {fields.map((field) => (
                        <SortableField
                            key={field.id}
                            field={field}
                            isSelected={field.id === selectedFieldId}
                            onSelect={(e) => {
                                e.stopPropagation();
                                onFieldSelect(field.id);
                            }}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
