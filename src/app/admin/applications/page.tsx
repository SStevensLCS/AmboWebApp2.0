import AdminApplicationList from "@/components/AdminApplicationList";

export const metadata = {
    title: "Application Management | Admin Dashboard",
    description: "View and manage student ambassador applications.",
};

export default function AdminApplicationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Applications</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    Manage incoming student ambassador applications.
                </p>
            </div>

            <AdminApplicationList />
        </div>
    );
}
