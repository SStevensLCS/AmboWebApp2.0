"use client";

import { useState, useEffect, useMemo } from "react";
import { getApplications } from "@/actions/admin";
import { ApplicationData } from "@ambo/database/application-types";
import { Loader2, Search, Eye, ChevronRight, ClipboardList } from "lucide-react";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminApplicationList() {
    const [applications, setApplications] = useState<ApplicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApp, setSelectedApp] = useState<ApplicationData | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const data = await getApplications();
            setApplications(data || []);
        } catch (error) {
            console.error("Failed to fetch applications", error);
            toast.error("Failed to load applications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: applications.length, submitted: 0, draft: 0, approved: 0, rejected: 0 };
        applications.forEach((app) => {
            if (app.status && counts[app.status] !== undefined) counts[app.status]++;
        });
        return counts;
    }, [applications]);

    const filteredApps = applications.filter(app => {
        const matchesSearch =
            (app.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (app.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (app.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (app.phone_number?.includes(searchTerm));

        const matchesStatus = statusFilter === "all" || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleView = (app: ApplicationData) => {
        setSelectedApp(app);
        setModalOpen(true);
    };

    const statusClass = (status: string | undefined) => cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        status === 'submitted' && "bg-blue-100 text-blue-800",
        status === 'approved' && "bg-green-100 text-green-800",
        status === 'rejected' && "bg-red-100 text-red-800",
        status === 'draft' && "bg-gray-100 text-gray-800",
    );

    return (
        <div className="space-y-4">
            {/* Filter Chips & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex gap-2 flex-wrap">
                    {(["all", "submitted", "draft", "approved", "rejected"] as const).map((s) => (
                        <Button
                            key={s}
                            variant={statusFilter === s ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(s)}
                            className="gap-1.5 capitalize"
                        >
                            {s === "all" ? "All" : s}
                            <Badge
                                variant="secondary"
                                className={`ml-0.5 px-1.5 py-0 text-[10px] min-w-[20px] text-center ${statusFilter === s ? "bg-background/20 text-primary-foreground" : ""}`}
                            >
                                {statusCounts[s]}
                            </Badge>
                        </Button>
                    ))}
                </div>
                <div className="relative sm:ml-auto sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search applicants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="text-center py-12 border rounded-xl bg-muted/30">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                            <ClipboardList className="w-7 h-7" />
                        </div>
                        <h3 className="font-medium">No applications found</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {statusFilter !== "all" || searchTerm ? "Try adjusting your filters." : "Applications will appear here."}
                        </p>
                    </div>
                ) : (
                    filteredApps.map((app) => (
                        <button
                            key={app.id}
                            onClick={() => handleView(app)}
                            className="w-full bg-white border rounded-lg p-3.5 flex items-center gap-3 active:bg-gray-50 hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">
                                        {app.first_name || app.last_name
                                            ? `${app.first_name || ""} ${app.last_name || ""}`.trim()
                                            : <span className="italic text-muted-foreground">Untitled Draft</span>}
                                    </span>
                                    {app.status && (
                                        <span className={statusClass(app.status)}>{app.status}</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {app.email || app.phone_number || "—"}
                                    {app.grade_current ? ` · Grade ${app.grade_current}` : ""}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </button>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Grade</th>
                                <th className="px-4 py-3">Submitted</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-4">
                                        <div className="space-y-3 px-4">
                                            {[1, 2, 3].map((i) => (
                                                <Skeleton key={i} className="h-10 w-full" />
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <ClipboardList className="h-8 w-8 opacity-40" />
                                            <p className="font-medium">No applications found</p>
                                            <p className="text-xs">
                                                {statusFilter !== "all" || searchTerm ? "Try adjusting your filters." : "Applications will appear here."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredApps.map((app) => (
                                    <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {app.first_name || app.last_name ? `${app.first_name || ""} ${app.last_name || ""}` : <span className="text-muted-foreground italic">Untitled Draft</span>}
                                            <div className="text-xs text-muted-foreground">{app.email || app.phone_number}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={statusClass(app.status)}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{app.grade_current ? `${app.grade_current}th` : "-"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleView(app)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ApplicationDetailModal
                application={selectedApp}
                open={modalOpen}
                onOpenChange={setModalOpen}
                onStatusUpdate={fetchApplications}
            />
        </div>
    );
}
