export type FieldType = "text" | "email" | "tel" | "number" | "select" | "textarea" | "info" | "review";

export interface FieldOption {
    label: string;
    value: string;
}

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];
    className?: string; // For grid spans
    content?: string; // For 'info' type
    reference?: string; // e.g. "#FirstName"
}

export interface FormStep {
    id: string;
    title: string;
    description?: string;
    fields: FormField[];
}
