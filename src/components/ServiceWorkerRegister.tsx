"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator && typeof window !== "undefined") {
            navigator.serviceWorker
                .register("/sw.js")
                .then(async (registration) => {
                    console.log("SW registered scope: ", registration.scope);

                    // Check if subscription exists and sync with server
                    try {
                        const sub = await registration.pushManager.getSubscription();
                        if (sub) {
                            await fetch("/api/web-push/subscription", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ subscription: sub }),
                            });
                        }
                    } catch (err) {
                        console.error("Failed to sync sub:", err);
                    }
                })
                .catch((error) => console.log("SW registration failed: ", error));
        }
    }, []);

    return null;
}
