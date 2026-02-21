"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Papa from "papaparse";
import { uploadApplicants, type ApplicantData } from "@/actions/applicants";

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState<ApplicantData[]>([]);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const parsedData = results.data as any[];

                // Map CSV columns to our data structure
                // Expects: First Name, Last Name, Current Grade
                const newApplicants: ApplicantData[] = parsedData.map((row: any) => ({
                    firstName: row["First Name"] || row["FirstName"] || row["first_name"] || "",
                    lastName: row["Last Name"] || row["LastName"] || row["last_name"] || "",
                    grade: row["Current Grade"] || row["Grade"] || row["grade"] || "",
                    email: row["Email"] || row["email"] || undefined
                })).filter(a => a.firstName && a.lastName); // Basic validation

                if (newApplicants.length > 0) {
                    // Optimistic update
                    setApplicants(prev => [...prev, ...newApplicants]);

                    // Try to save to server
                    try {
                        const result = await uploadApplicants(newApplicants);
                        if (!result.success) {
                            console.error("Failed to sync to database:", result.error);
                        }
                    } catch (e) {
                        console.error("Upload failed", e);
                    }
                }
                setLoading(false);
            },
            error: (error) => {
                console.error("CSV Parse Error:", error);
                setLoading(false);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Applicants</h1>
                    <p className="text-muted-foreground mt-1 text-sm md:text-base">Manage and view applicant details.</p>
                </div>
                <div className="relative self-start sm:self-auto">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={loading}
                    />
                    <Button disabled={loading}>
                        {loading ? (
                            <span className="animate-spin mr-2">⏳</span>
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload CSV
                    </Button>
                </div>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-2">
                {applicants.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">No applicants yet. Upload a CSV to get started.</p>
                    </div>
                ) : (
                    applicants.map((applicant, index) => (
                        <div
                            key={index}
                            className="bg-white border rounded-lg p-3.5 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div>
                                <p className="font-medium text-sm">{applicant.firstName} {applicant.lastName}</p>
                                {applicant.grade && (
                                    <p className="text-xs text-muted-foreground mt-0.5">Grade {applicant.grade}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>First Name</TableHead>
                            <TableHead>Last Name</TableHead>
                            <TableHead>Current Grade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applicants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No applicants found. Upload a CSV file to populate the list.
                                </TableCell>
                            </TableRow>
                        ) : (
                            applicants.map((applicant, index) => (
                                <TableRow key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                    <TableCell className="font-medium">{applicant.firstName}</TableCell>
                                    <TableCell>{applicant.lastName}</TableCell>
                                    <TableCell>{applicant.grade}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
