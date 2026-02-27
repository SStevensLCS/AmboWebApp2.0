"use client";

import { useState, useEffect } from "react";
import { getApplications } from "@/actions/admin";
import { ApplicationData } from "@ambo/database/application-types";
import { Loader2, Search, Filter, Eye, ChevronRight } from "lucide-react";
import { ApplicationDetailModal } from "./ApplicationDetailModal";
import { cn } from "@/lib/utils";

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

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
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        placeholder="Search applicants..."
                        className="pl-9 h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        className="h-10 flex-1 sm:flex-none rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
                {loading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading applications...
                    </div>
                ) : filteredApps.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No applications found.</p>
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
                                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading applications...
                                    </td>
                                </tr>
                            ) : filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                        No applications found.
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
