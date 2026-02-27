"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle, RefreshCw, Smartphone, Globe, Shield } from "lucide-react";

type LogEntry = {
    id: number;
    message: string;
    type: "info" | "error" | "success";
    timestamp: string;
};

export default function DebugPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [swStatus, setSwStatus] = useState<"unknown" | "supported" | "unsupported">("unknown");
    const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(false);

    function addLog(message: string, type: "info" | "error" | "success" = "info") {
        const entry: LogEntry = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString(),
        };
        setLogs((prev) => [entry, ...prev]);
    }

    useEffect(() => {
        checkStatus();
    }, []);

    async function checkStatus() {
        setLoading(true);
        addLog("Checking environment...");

        // 1. Check Service Worker Support
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setSwStatus("supported");
            addLog("Service Worker & Push API supported", "success");
        } else {
            setSwStatus("unsupported");
            addLog("Service Worker or Push API NOT supported", "error");
            setLoading(false);
            return;
        }

        // 2. Check Permission
        setPermission(Notification.permission);
        addLog(`Notification Permission: ${Notification.permission}`, Notification.permission === "granted" ? "success" : "error");

        // 3. Check Registration & Subscription
        try {
            const registration = await navigator.serviceWorker.ready;
            addLog(`Service Worker Scope: ${registration.scope}`);

            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                setSubscription(sub);
                addLog("Found active subscription", "success");
                addLog(`Endpoint: ${sub.endpoint.substring(0, 30)}...`);
            } else {
                setSubscription(null);
                addLog("No active subscription found", "error");
            }
        } catch (err: any) {
            addLog(`Error checking SW: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleSync() {
        if (!subscription) {
            addLog("Cannot sync: No subscription found", "error");
            return;
        }

        setLoading(true);
        addLog("Attempting to sync with server...");

        try {
            const res = await fetch("/api/web-push/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription }),
            });

            if (res.ok) {
                addLog("Sync successful!", "success");
            } else {
                const err = await res.text();
                addLog(`Sync failed: ${res.status} ${err}`, "error");
            }
        } catch (err: any) {
            addLog(`Network error during sync: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    async function forceUnsubscribe() {
        setLoading(true);
        addLog("Unsubscribing...");
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                setSubscription(null);
                addLog("Unsubscribed from Push Manager", "success");
            } else {
                addLog("Nothing to unsubscribe from", "info");
            }
        } catch (err: any) {
            addLog(`Unsubscribe failed: ${err.message}`, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container max-w-lg mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold">Push Debugger</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Status Overview</CardTitle>
                    <CardDescription>Current state of your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <span>Browser Support</span>
                        </div>
                        <StatusBadge status={swStatus === "supported"} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <span>Permission</span>
                        </div>
                        <span className={permission === "granted" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {permission}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-muted-foreground" />
                            <span>Subscription</span>
                        </div>
                        <StatusBadge status={!!subscription} />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
                <Button onClick={checkStatus} disabled={loading} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh Status
                </Button>
                <Button onClick={handleSync} disabled={!subscription || loading}>
                    Sync to Server
                </Button>
                <Button onClick={forceUnsubscribe} disabled={!subscription || loading} variant="destructive" className="col-span-2">
                    Force Unsubscribe (Reset)
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-muted p-4 rounded-md h-64 overflow-y-auto font-mono text-xs space-y-1">
                        {logs.length === 0 && <span className="text-muted-foreground">No logs yet...</span>}
                        {logs.map((log) => (
                            <div key={log.id} className={`break-words ${log.type === "error" ? "text-red-500" : log.type === "success" ? "text-green-600" : ""}`}>
                                [{log.timestamp}] {log.message}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: boolean }) {
    return status ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
        <AlertCircle className="w-5 h-5 text-red-500" />
    );
}
