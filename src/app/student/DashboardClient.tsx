"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PlusCircle, ArrowRight } from "lucide-react";

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

export default function DashboardClient({ submissions }: DashboardClientProps) {
    // Filter states - all true by default
    const [showApproved, setShowApproved] = useState(true);
    const [showPending, setShowPending] = useState(true);
    const [showDenied, setShowDenied] = useState(true);

    // Filter logic
    const filteredSubmissions = submissions.filter((sub) => {
        if (sub.status === "Approved" && !showApproved) return false;
        if (sub.status === "Pending" && !showPending) return false;
        if (sub.status === "Denied" && !showDenied) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Search/Submit Card */}
            <Card className="border-dashed border-2 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <Link href="/student/events/new">
                    <CardContent className="flex items-center justify-between p-6 cursor-pointer">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <PlusCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Log New Activity</h3>
                                <p className="text-sm text-muted-foreground">Submit a new service entry or event.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                    </CardContent>
                </Link>
            </Card>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold tracking-tight">Recent Submissions</h2>

                    {/* Filter Switches */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filter-approved"
                                checked={showApproved}
                                onCheckedChange={setShowApproved}
                            />
                            <Label htmlFor="filter-approved" className="text-sm font-medium cursor-pointer">Approved</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filter-pending"
                                checked={showPending}
                                onCheckedChange={setShowPending}
                            />
                            <Label htmlFor="filter-pending" className="text-sm font-medium cursor-pointer">Pending</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="filter-denied"
                                checked={showDenied}
                                onCheckedChange={setShowDenied}
                            />
                            <Label htmlFor="filter-denied" className="text-sm font-medium cursor-pointer">Denied</Label>
                        </div>
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
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No submissions found.
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
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No submissions found.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
