"use client";

import { useState } from "react";
import { EventCalendar } from "@/components/EventCalendar";
import { EventModal } from "@/components/EventModal";

export function AdminEventsContent({ userId, userRole }: { userId: string; userRole: string }) {
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    return (
        <>
            <EventCalendar onEventClick={setSelectedEvent} />
            {selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    currentUserId={userId}
                    userRole={userRole}
                />
            )}
        </>
    );
}
