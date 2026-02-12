"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, Loader2, ExternalLink } from "lucide-react";

export function GoogleCalendarSetup() {
    const [connected, setConnected] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/google/status")
            .then((r) => r.json())
            .then((data) => {
                setConnected(data.connected);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleConnect = () => {
        window.location.href = "/api/auth/google";
    };

    return (
        <Card className="border-dashed">
            <CardContent className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${connected
                                ? "bg-green-100 text-green-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                    >
                        <CalendarCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            Google Calendar
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {loading
                                ? "Checking..."
                                : connected
                                    ? "Connected — events sync automatically"
                                    : "Not connected"}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : connected ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConnect}
                        className="gap-2"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Reconnect
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={handleConnect}
                        className="gap-2"
                    >
                        <CalendarCheck2 className="h-3.5 w-3.5" />
                        Connect
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
