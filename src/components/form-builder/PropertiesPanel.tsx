"use client";

import React from "react";
import { FormField } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PropertiesPanelProps {
    field: FormField;
    onChange: (updates: Partial<FormField>) => void;
    onDelete: () => void;
}

export function PropertiesPanel({ field, onChange, onDelete }: PropertiesPanelProps) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Field Label</Label>
                <Input
                    value={field.label}
                    onChange={(e) => onChange({ label: e.target.value })}
                    placeholder="e.g. Full Name"
                />
            </div>

            <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                    value={field.placeholder || ""}
                    onChange={(e) => onChange({ placeholder: e.target.value })}
                    placeholder="e.g. Enter value..."
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => onChange({ required: checked })}
                />
            </div>

            <Separator />

            <Button variant="destructive" className="w-full" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Field
            </Button>
        </div>
    );
}
