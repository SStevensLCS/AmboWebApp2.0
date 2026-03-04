"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PlusCircle, FileText, ClipboardList } from "lucide-react";

interface Submission {
    id: string;
    user_id: string;
    service_date: string;
    service_type: string;
    hours: number;
    credits: number;
    status: "Approved" | "Denied" | "Pending";
    created_at: string;
}

interface DashboardClientProps {
    submissions: Submission[];
}

const STATUS_FILTERS = ["All", "Approved", "Pending", "Denied"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function DashboardClient({ submissions }: DashboardClientProps) {
    const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { All: submissions.length, Approved: 0, Pending: 0, Denied: 0 };
        submissions.forEach((s) => { if (counts[s.status] !== undefined) counts[s.status]++; });
        return counts;
    }, [submissions]);

    const filteredSubmissions = activeFilter === "All"
        ? submissions
        : submissions.filter((sub) => sub.status === activeFilter);

    return (
        <div className="space-y-6">
            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <Link href="/student/events/new">
                        <CardContent className="flex flex-col items-center text-center p-4 sm:p-6 cursor-pointer gap-3">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <PlusCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-lg">Log New Activity</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Submit a new service entry.</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>

                <Card className="border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <Link href="/student/resources">
                        <CardContent className="flex flex-col items-center text-center p-4 sm:p-6 cursor-pointer gap-3">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm sm:text-lg">Resources</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">View shared files and documents.</p>
                            </div>
                        </CardContent>
                    </Link>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Submissions</h2>

                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((status) => (
                            <Button
                                key={status}
                                variant={activeFilter === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveFilter(status)}
                                className="gap-1.5"
                            >
                                {status}
                                <Badge
                                    variant="secondary"
                                    className={`ml-0.5 px-1.5 py-0 text-[10px] min-w-[20px] text-center ${activeFilter === status ? "bg-background/20 text-primary-foreground" : ""}`}
                                >
                                    {statusCounts[status]}
                                </Badge>
                            </Button>
                        ))}
                    </div>
                </div>

                <Card>
                    {/* Desktop Table */}
                    <div className="hidden sm:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubmissions.map((submission) => (
                                    <TableRow key={submission.id}>
                                        <TableCell>{submission.service_date}</TableCell>
                                        <TableCell>{submission.service_type}</TableCell>
                                        <TableCell>{Number(submission.hours)}</TableCell>
                                        <TableCell>{Number(submission.credits)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    submission.status === "Approved"
                                                        ? "default"
                                                        : submission.status === "Denied"
                                                            ? "destructive"
                                                            : "secondary"
                                                }
                                                className={
                                                    submission.status === "Approved" ? "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200" :
                                                        submission.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200"
                                                }
                                            >
                                                {submission.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredSubmissions.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-32">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ClipboardList className="h-8 w-8 opacity-40" />
                                                <p className="font-medium">
                                                    {submissions.length === 0 ? "No submissions yet" : "No matching submissions"}
                                                </p>
                                                {submissions.length === 0 && (
                                                    <p className="text-xs">Log your first activity to get started.</p>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile List */}
                    <div className="sm:hidden divide-y">
                        {filteredSubmissions.map((submission) => (
                            <div key={submission.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{submission.service_date}</span>
                                    <Badge
                                        variant={
                                            submission.status === "Approved"
                                                ? "default"
                                                : submission.status === "Denied"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                        className={
                                            submission.status === "Approved" ? "bg-green-100 text-green-800 border-green-200" :
                                                submission.status === "Denied" ? "" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        }
                                    >
                                        {submission.status}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Type</span>
                                        {submission.service_type}
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Hours</span>
                                        {Number(submission.hours)}
                                    </div>
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-muted-foreground/70">Credits</span>
                                        {Number(submission.credits)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredSubmissions.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                <ClipboardList className="h-8 w-8 opacity-40 mx-auto mb-2" />
                                <p className="font-medium text-sm">
                                    {submissions.length === 0 ? "No submissions yet" : "No matching submissions"}
                                </p>
                                {submissions.length === 0 && (
                                    <p className="text-xs mt-1">Log your first activity to get started.</p>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
