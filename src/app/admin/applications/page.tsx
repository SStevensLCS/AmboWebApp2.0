"use strict";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PlusCircle, FileText } from "lucide-react";

export default function ApplicationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
                <Link href="/admin/applications/create">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Application Form
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Mock Data for now */}
                {[1, 2].map((id) => (
                    <Card key={id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                General Application {id}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">120</div>
                            <p className="text-xs text-muted-foreground">
                                Total submissions
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
