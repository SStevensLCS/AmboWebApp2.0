"use client";

import { useState } from "react";
import { EventCalendar } from "@/components/EventCalendar";
import { EventModal } from "@/components/EventModal";
import type { EventDetails, UserRole } from "@ambo/database/types";

export function AdminEventsContent({ userId, userRole }: { userId: string; userRole: UserRole }) {
    const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);

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
