"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator && typeof window !== "undefined") {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => console.log("SW registered scope: ", registration.scope))
                .catch((error) => console.log("SW registration failed: ", error));
        }
    }, []);

    return null;
}
