/**
 * Service Worker for Push Notifications
 */

// Helper to send logs to server
async function logToServer(level, message, data = {}) {
    try {
        await fetch("/api/debug/log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level, message, data }),
        });
    } catch (err) {
        console.error("Failed to send log to server:", err);
    }
}

self.addEventListener("install", (event) => {
    event.waitUntil(logToServer("info", "Service Worker Installed"));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(logToServer("info", "Service Worker Activated"));
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
    const data = event.data ? event.data.json() : null;

    event.waitUntil(
        (async () => {
            await logToServer("info", "Push Event Received", {
                hasData: !!event.data,
                dataPayload: data
            });

            if (data) {
                const options = {
                    body: data.body,
                    icon: "/logo.png", // Ensure this path is valid
                    badge: "/logo.png",
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: "2",
                        url: data.url,
                    },
                };

                try {
                    await self.registration.showNotification(data.title, options);
                    await logToServer("info", "Notification Shown Successfully", { title: data.title, options });
                } catch (err) {
                    await logToServer("error", "showNotification Failed", { error: err.toString() });
                    throw err;
                }
            } else {
                await logToServer("warn", "Push received but no data");
            }
        })()
    );
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    event.waitUntil(
        (async () => {
            await logToServer("info", "Notification Clicked", { url: event.notification.data.url });

            // Open the URL
            if (clients.openWindow && event.notification.data.url) {
                await clients.openWindow(event.notification.data.url);
            }
        })()
    );
});
