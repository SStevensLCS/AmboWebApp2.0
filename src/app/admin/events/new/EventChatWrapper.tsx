"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EventChatWrapper({ userId }: { userId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        title: "",
        notes: "",
        start_time: "",
        end_time: "",
        max_rsvps: "",
    });

    const update = (key: string, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!form.title.trim()) {
            setError("Event title is required.");
            setLoading(false);
            return;
        }
        if (!form.start_time || !form.end_time) {
            setError("Start and end times are required.");
            setLoading(false);
            return;
        }

        const start = new Date(form.start_time);
        const end = new Date(form.end_time);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            setError("Invalid date/time.");
            setLoading(false);
            return;
        }

        if (end <= start) {
            setError("End time must be after start time.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title.trim(),
                    description: form.notes.trim() || null,
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || "Failed to create event.");
                setLoading(false);
                return;
            }

            router.push("/admin/events");
        } catch {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-panel p-5 space-y-4 animate-fade-in">
            <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                    Event Title
                </label>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Campus Tour, Open House"
                    className="glass-input"
                    required
                />
            </div>

            <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                    Event Notes
                </label>
                <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    placeholder="Details about the event..."
                    rows={3}
                    className="glass-input resize-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                        Start Time
                    </label>
                    <input
                        type="datetime-local"
                        value={form.start_time}
                        onChange={(e) => {
                            const newStart = e.target.value;
                            // Calculate new end time (start + 1 hour)
                            if (newStart) {
                                const startDate = new Date(newStart);
                                const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                                // Format to YYYY-MM-DDTHH:mm for local datetime input
                                // We need to handle timezone offset to get local time string in ISO-like format
                                const off = endDate.getTimezoneOffset() * 60000;
                                const localISOTime = (new Date(endDate.getTime() - off)).toISOString().slice(0, 16);

                                setForm(prev => ({ ...prev, start_time: newStart, end_time: localISOTime }));
                            } else {
                                update("start_time", newStart);
                            }
                        }}
                        className="glass-input"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                        End Time
                    </label>
                    <input
                        type="datetime-local"
                        value={form.end_time}
                        onChange={(e) => update("end_time", e.target.value)}
                        className="glass-input"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
                    People Needed (RSVP Slots)
                </label>
                <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.max_rsvps}
                    onChange={(e) => update("max_rsvps", e.target.value)}
                    placeholder="e.g. 5"
                    className="glass-input"
                />
            </div>

            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="glass-btn-primary w-full"
            >
                {loading ? "Creating..." : "Create Event"}
            </button>
        </form>
    );
}
