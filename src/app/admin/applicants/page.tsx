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
                            // Optional: Show toast error, but keeping data in UI
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Applicants</h1>
                    <p className="text-muted-foreground mt-2">Manage and view applicant details.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
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
            </div>

            <div className="border rounded-md">
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
