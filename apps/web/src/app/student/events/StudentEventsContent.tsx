"use client";

import { useState, useRef } from "react";
import { EventCalendar } from "@/components/EventCalendar";
import { EventModal } from "@/components/EventModal";
import type { EventDetails, UserRole } from "@ambo/database/types";

export function StudentEventsContent({ userId, userRole }: { userId: string; userRole: UserRole }) {
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
    const calendarRefreshRef = useRef<(() => void) | null>(null);

    return (
        <>
            <EventCalendar
                onEventClick={setSelectedEvent}
                onRefreshRef={(fn) => { calendarRefreshRef.current = fn; }}
            />
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    currentUserId={userId}
                    userRole={userRole}
                    onEventChanged={() => calendarRefreshRef.current?.()}
                />
            )}
        </>
    );
}
