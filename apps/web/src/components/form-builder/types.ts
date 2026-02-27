export type FieldType = "text" | "number" | "textarea" | "checkbox" | "select" | "date";

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[]; // For select fields
}

export const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
    { type: "text", label: "Text Input", icon: "Type" },
    { type: "number", label: "Number Input", icon: "Hash" },
    { type: "textarea", label: "Text Area", icon: "AlignLeft" },
    { type: "checkbox", label: "Checkbox", icon: "CheckSquare" },
    { type: "select", label: "Dropdown", icon: "List" },
    { type: "date", label: "Date Picker", icon: "Calendar" },
];
