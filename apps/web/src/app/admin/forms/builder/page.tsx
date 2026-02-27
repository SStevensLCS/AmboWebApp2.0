import FormBuilder from "@/components/admin/FormBuilder";

export default function FormBuilderPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="border-b p-4 bg-background flex items-center justify-between">
                <h1 className="font-semibold text-lg">Form Builder</h1>
                <button className="glass-btn-primary text-xs px-3 py-1.5 h-auto">
                    Save Form
                </button>
            </div>
            <FormBuilder />
        </div>
    );
}
