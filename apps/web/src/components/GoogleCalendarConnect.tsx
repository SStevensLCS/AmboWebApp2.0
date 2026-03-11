"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function GoogleCalendarConnect() {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        fetch("/api/auth/google/student/status")
            .then((res) => res.json())
            .then((data) => setConnected(data.connected))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleConnect = () => {
        window.location.href = "/api/auth/google/student";
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        try {
            const res = await fetch("/api/auth/google/student/status", { method: "DELETE" });
            if (res.ok) {
                setConnected(false);
                toast.success("Google Calendar disconnected");
            } else {
                toast.error("Failed to disconnect calendar");
            }
        } catch {
            toast.error("Failed to disconnect calendar");
        } finally {
            setDisconnecting(false);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <CardTitle className="text-lg">Google Calendar</CardTitle>
                </div>
                <CardDescription>
                    Sync events to your personal Google Calendar.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Button disabled variant="outline" className="w-full sm:w-auto">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </Button>
                ) : connected ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Connected</span>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="w-full sm:w-auto text-destructive hover:text-destructive"
                        >
                            {disconnecting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            {disconnecting ? "Disconnecting..." : "Disconnect Calendar"}
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleConnect} className="w-full sm:w-auto">
                        <Calendar className="mr-2 h-4 w-4" />
                        Connect Google Calendar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
