"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            registerServiceWorker();
        } else {
            setLoading(false);
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();

            // Sync with server if subscription exists locally
            if (sub) {
                await fetch("/api/web-push/subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscription: sub }),
                });
            }

            setSubscription(sub);
        } catch (error) {
            console.error("Error checking subscription:", error);
        } finally {
            setLoading(false);
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidKey) {
                throw new Error("VAPID public key not found");
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey),
            });

            // Send subscription to server
            await fetch("/api/web-push/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription: sub }),
            });

            setSubscription(sub);
        } catch (error) {
            console.error("Failed to subscribe:", error);
            alert("Failed to enable notifications. Please make sure you are using a supported browser (Chrome, Safari on iOS PWA).");
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        setLoading(true);
        try {
            if (subscription) {
                // Remove from server
                await fetch("/api/web-push/subscription", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                await subscription.unsubscribe();
                setSubscription(null);
            }
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        } finally {
            setLoading(false);
        }
    }

    if (!isSupported) {
        return null; // Don't show if not supported (e.g. desktop safari, old browsers)
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle className="text-lg">Push Notifications</CardTitle>
                </div>
                <CardDescription>
                    Receive alerts for new posts and comments on your device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Button disabled variant="outline" className="w-full sm:w-auto">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </Button>
                ) : subscription ? (
                    <Button
                        variant="outline"
                        onClick={unsubscribeFromPush}
                        className="w-full sm:w-auto text-destructive hover:text-destructive"
                    >
                        <BellOff className="mr-2 h-4 w-4" />
                        Disable Notifications
                    </Button>
                ) : (
                    <Button
                        onClick={subscribeToPush}
                        className="w-full sm:w-auto"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Enable Notifications
                    </Button>
                )}

                {!subscription && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Note: On iPhone, you must add this app to your Home Screen for notifications to work.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
