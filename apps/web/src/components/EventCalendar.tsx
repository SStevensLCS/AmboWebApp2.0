"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { EventDetails } from "@ambo/database/types";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export function EventCalendar({
    onEventClick,
}: {
    onEventClick: (e: EventDetails) => void;
}) {
    const [events, setEvents] = useState<EventDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const upcomingRef = useRef<HTMLDivElement>(null);

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
        setLoading(false);
    };

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(fetchEvents, 30000);
        return () => clearInterval(interval);
    }, []);

    // Scroll to upcoming events after initial load
    useEffect(() => {
        if (!loading && events.length > 0 && upcomingRef.current) {
            const timer = setTimeout(() => {
                upcomingRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, events.length]);

    const grouped = events.reduce(
        (acc, ev) => {
            const date = new Date(ev.start_time).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(ev);
            return acc;
        },
        {} as Record<string, EventDetails[]>
    );

    // Determine the next upcoming date group for auto-scroll
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sortedDateKeys = Object.keys(grouped).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    const nextUpcomingDateKey = sortedDateKeys.find(
        (dateStr) => new Date(dateStr) >= today
    ) || null;

    const typeColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        tour: "default",
        meeting: "secondary",
        training: "outline",
        social: "default", // Maps to default for now, can be customized
        other: "secondary",
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {Object.entries(grouped)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([date, evts]) => (
                <motion.div
                    key={date}
                    className="space-y-4"
                    variants={itemVariants}
                    ref={date === nextUpcomingDateKey ? upcomingRef : undefined}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            {new Date(date).toLocaleDateString([], {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                            })}
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {evts.map((ev) => (
                            <motion.div
                                key={ev.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.96 }}
                            >
                                <Card
                                    onClick={() => onEventClick(ev)}
                                    className="cursor-pointer hover:shadow-md transition-all duration-200 h-full"
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-semibold line-clamp-1" title={ev.title}>{ev.title}</h4>
                                        </div>
                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>
                                                    {new Date(ev.start_time).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                    {" - "}
                                                    {new Date(ev.end_time).toLocaleTimeString([], {
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="line-clamp-2 text-sm text-muted-foreground mt-2 h-10">
                                            {ev.description || "\u00A0"}
                                        </p>

                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div >
            ))
            }
            {
                events.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No upcoming events</p>
                        <p className="text-sm mt-1">Check back later for new events.</p>
                    </div>
                )
            }
        </motion.div >
    );
}
