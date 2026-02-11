"use client";

import { useEffect, useState } from "react";

type EventDetails = {
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    location: string;
    type: string;
    created_by: string;
};

export function EventCalendar({
    onEventClick,
}: {
    onEventClick: (e: EventDetails) => void;
}) {
    const [events, setEvents] = useState<EventDetails[]>([]);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data.events || []);
            }
        } catch (e) {
            console.error("Failed to fetch events", e);
        }
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    const grouped = events.reduce(
        (acc, ev) => {
            const date = new Date(ev.start_time).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(ev);
            return acc;
        },
        {} as Record<string, EventDetails[]>
    );

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([date, evts]) => (
                <div key={date}>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-2">
                        {date}
                    </p>
                    <div className="space-y-2">
                        {evts.map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => onEventClick(ev)}
                                className="glass-card p-3 cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-sm">{ev.title}</span>
                                    <span className="text-xs text-[var(--text-tertiary)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                                        {ev.type}
                                    </span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    {new Date(ev.start_time).toLocaleTimeString([], {
                                        hour: "numeric",
                                        minute: "2-digit",
                                    })}
                                    {ev.location && ` · ${ev.location}`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {events.length === 0 && (
                <p className="text-[var(--text-tertiary)] text-sm">No upcoming events.</p>
            )}
        </div>
    );
}
