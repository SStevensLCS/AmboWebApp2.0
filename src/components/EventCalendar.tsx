"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

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
    const [loading, setLoading] = useState(true);

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

    const grouped = events.reduce(
        (acc, ev) => {
            const date = new Date(ev.start_time).toDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(ev);
            return acc;
        },
        {} as Record<string, EventDetails[]>
    );

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
            {Object.entries(grouped).map(([date, evts]) => (
                <motion.div key={date} className="space-y-4" variants={itemVariants}>
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
                                    className="cursor-pointer hover:shadow-md transition-all duration-200 h-full border-l-4 border-l-primary/20 hover:border-l-primary"
                                >
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-semibold line-clamp-1" title={ev.title}>{ev.title}</h4>
                                            {ev.type && (
                                                <Badge variant={typeColors[ev.type.toLowerCase()] || "secondary"} className="shrink-0 capitalize">
                                                    {ev.type}
                                                </Badge>
                                            )}
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
                                            {ev.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="truncate">{ev.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            ))}
            {events.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No upcoming events</p>
                    <p className="text-sm mt-1">Check back later for new events.</p>
                </div>
            )}
        </motion.div>
    );
}
