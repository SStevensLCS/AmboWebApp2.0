"use client";

import React, { useState } from "react";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { FormField, FieldType } from "./types";
import { Toolbox } from "./Toolbox";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

export function FormBuilder() {
    const [fields, setFields] = useState<FormField[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<FieldType | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
    }));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragItem(event.active.data.current?.type as FieldType);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Dropped from toolbox to canvas
        if (active.data.current?.isToolboxItem && over.id === "canvas-droppable") {
            const type = active.data.current.type as FieldType;
            const newField: FormField = {
                id: uuidv4(),
                type,
                label: `New ${type} field`,
                required: false,
                placeholder: "",
                options: type === "select" ? ["Option 1", "Option 2"] : undefined,
            };
            setFields((prev) => [...prev, newField]);
            setSelectedFieldId(newField.id);
        }
        // Reordering within canvas
        else if (active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const deleteField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const selectedField = fields.find(f => f.id === selectedFieldId) || null;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Link href="/admin/applications">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Form Builder</h1>
                </div>
                <Button><Save className="mr-2 h-4 w-4" /> Save Form</Button>
            </div>

            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-1 gap-4 h-full overflow-hidden">
                    {/* Left: Toolbox */}
                    <div className="w-64 bg-slate-50 border rounded-lg p-4 overflow-y-auto">
                        <h2 className="font-semibold mb-4">Form Elements</h2>
                        <Toolbox />
                    </div>

                    {/* Center: Canvas */}
                    <div className="flex-1 bg-slate-100 border rounded-lg p-8 flex justify-center overflow-y-auto">
                        <Canvas
                            fields={fields}
                            onFieldSelect={setSelectedFieldId}
                            selectedFieldId={selectedFieldId}
                            setFields={setFields}
                        />
                    </div>

                    {/* Right: Properties */}
                    <div className="w-80 bg-white border rounded-lg p-4 overflow-y-auto">
                        <h2 className="font-semibold mb-4">Properties</h2>
                        {selectedField ? (
                            <PropertiesPanel
                                field={selectedField}
                                onChange={(updates) => updateField(selectedField.id, updates)}
                                onDelete={() => deleteField(selectedField.id)}
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">Select a field to edit properties.</p>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeDragItem ? (
                        <div className="bg-white border p-2 rounded shadow opacity-80 w-40">
                            {activeDragItem}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
