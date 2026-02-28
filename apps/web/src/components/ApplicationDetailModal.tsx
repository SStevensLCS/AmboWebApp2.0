"use client";

import { useState } from "react";
import { ApplicationData, ApplicationStatus } from "@ambo/database/application-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { updateApplicationStatus } from "@/actions/admin";
import { Loader2, Check, X, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationDetailModalProps {
    application: ApplicationData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusUpdate: () => void; // Callback to refresh list
}

export function ApplicationDetailModal({ application, open, onOpenChange, onStatusUpdate }: ApplicationDetailModalProps) {
    const [updating, setUpdating] = useState(false);

    if (!application) return null;

    const handleStatusChange = async (newStatus: ApplicationStatus) => {
        if (!application.id) return;
        setUpdating(true);
        try {
            await updateApplicationStatus(application.id, newStatus);
            onStatusUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center justify-between">
                        <span>{application.first_name} {application.last_name}</span>
                        <span className={cn(
                            "text-sm px-3 py-1 rounded-full border",
                            application.status === 'submitted' && "bg-blue-50 text-blue-700 border-blue-200",
                            application.status === 'approved' && "bg-green-50 text-green-700 border-green-200",
                            application.status === 'rejected' && "bg-red-50 text-red-700 border-red-200",
                            application.status === 'draft' && "bg-gray-50 text-gray-700 border-gray-200",
                        )}>
                            {application.status.toUpperCase()}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base border-b pb-1">Contact Information</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{application.phone_number}</span>
                            <span className="text-muted-foreground">Email:</span>
                            <span>{application.email}</span>
                        </div>
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-base border-b pb-1">Academic Information</h3>
                        <div className="grid grid-cols-[100px_1fr] gap-2">
                            <span className="text-muted-foreground">Grade:</span>
                            <span>{application.grade_current}th (Entered in {application.grade_entry})</span>
                            <span className="text-muted-foreground">GPA:</span>
                            <span>{application.gpa}</span>
                            <span className="text-muted-foreground">Transcript:</span>
                            <span>
                                {application.transcript_url ? (
                                    <a href={application.transcript_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline flex items-center gap-1">
                                        <FileText className="w-4 h-4" /> View Transcript
                                    </a>
                                ) : "Not uploaded"}
                            </span>
                        </div>
                    </div>

                    {/* References */}
                    <div className="space-y-4 md:col-span-2">
                        <h3 className="font-semibold text-base border-b pb-1">References</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-3 rounded">
                                <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Academic Reference</p>
                                <p>{application.referrer_academic_name}</p>
                                <p className="text-muted-foreground">{application.referrer_academic_email}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded">
                                <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Spiritual Reference</p>
                                <p>{application.referrer_bible_name}</p>
                                <p className="text-muted-foreground">{application.referrer_bible_email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Questionnaire */}
                    <div className="space-y-4 md:col-span-2">
                        <h3 className="font-semibold text-base border-b pb-1">Questionnaire Responses</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Involvement</p>
                                <p className="bg-muted/20 p-3 rounded whitespace-pre-wrap">{application.q_involvement}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Why Ambassador?</p>
                                <p className="bg-muted/20 p-3 rounded whitespace-pre-wrap">{application.q_why_ambassador}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Faith Journey</p>
                                <p className="bg-muted/20 p-3 rounded whitespace-pre-wrap">{application.q_faith}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Love about Linfield</p>
                                    <p className="bg-muted/20 p-3 rounded whitespace-pre-wrap">{application.q_love_linfield}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Change about Linfield</p>
                                    <p className="bg-muted/20 p-3 rounded whitespace-pre-wrap">{application.q_change_linfield}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {application.status !== 'approved' && (
                        <button
                            disabled={updating}
                            onClick={() => handleStatusChange('approved')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Approve Application
                        </button>
                    )}

                    {application.status !== 'rejected' && (
                        <button
                            disabled={updating}
                            onClick={() => handleStatusChange('rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                            Reject Application
                        </button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
