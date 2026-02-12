"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
    role: "user" | "ai";
    content: string;
};

type EventFields = {
    event_name: string | null;
    hours: number | null;
    tour_credits: number | null;
    notes: string | null;
};

export function EventChat({
    userId,
    onEventCreated,
}: {
    userId: string;
    onEventCreated: () => void;
}) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "ai",
            content:
                "Hey! Tell me about the event you want to log — what was it, how long, and how did it go?",
        },
    ]);
    const [input, setInput] = useState("");
    const [fields, setFields] = useState<EventFields>({
        event_name: null,
        hours: null,
        tour_credits: null,
        notes: null,
    });
    const [loading, setLoading] = useState(false);
    const [awaitingConfirm, setAwaitingConfirm] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<
        { role: string; content: string }[]
    >([]);
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setInput("");
        setLoading(true);

        // Handle confirmation
        if (awaitingConfirm) {
            if (userMsg.toLowerCase().startsWith("y")) {
                await submitEvent();
            } else {
                setAwaitingConfirm(false);
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: "No problem. What would you like to change?" },
                ]);
            }
            setLoading(false);
            return;
        }

        // Send to Gemini
        const newHistory = [
            ...conversationHistory,
            { role: "user", content: userMsg },
        ];

        try {
            const res = await fetch("/api/gemini/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newHistory }),
            });

            if (!res.ok) {
                throw new Error("API error");
            }

            const data = await res.json();

            // Update fields with what Gemini extracted
            const merged: EventFields = { ...fields };
            if (data.fields) {
                if (data.fields.event_name) merged.event_name = data.fields.event_name;
                if (data.fields.hours != null) merged.hours = data.fields.hours;
                if (data.fields.tour_credits != null)
                    merged.tour_credits = data.fields.tour_credits;
                if (data.fields.notes) merged.notes = data.fields.notes;
            }
            setFields(merged);

            // Update conversation history
            setConversationHistory([
                ...newHistory,
                { role: "model", content: JSON.stringify(data) },
            ]);

            // If all fields are present, ask for confirmation
            if (
                data.complete &&
                merged.event_name &&
                merged.hours != null &&
                merged.tour_credits != null &&
                merged.notes
            ) {
                setAwaitingConfirm(true);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content: `${data.message}\n\nType "yes" to submit.`,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: data.message || "Could you tell me more?" },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: "Sorry, I had trouble processing that. Could you try again?",
                },
            ]);
        }

        setLoading(false);
    };

    const submitEvent = async () => {
        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: userId,
                    service_type: fields.event_name,
                    hours: fields.hours,
                    credits: fields.tour_credits,
                    service_date: new Date().toISOString().split("T")[0],
                    feedback: fields.notes,
                }),
            });

            if (res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: "Submitted! ✓" },
                ]);
                setFields({
                    event_name: null,
                    hours: null,
                    tour_credits: null,
                    notes: null,
                });
                setConversationHistory([]);
                setAwaitingConfirm(false);
                setTimeout(onEventCreated, 1200);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: "Something went wrong submitting. Try again?" },
                ]);
                setAwaitingConfirm(false);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "ai", content: "Network error. Try again?" },
            ]);
            setAwaitingConfirm(false);
        }
    };

    return (
        <Card className="h-[400px] sm:h-[450px] lg:h-[500px] flex flex-col shadow-sm">
            <CardHeader className="p-4 py-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI Assistant
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-4" ref={scrollContainerRef}>
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex gap-3",
                                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <Avatar className={cn("h-8 w-8 shrink-0", m.role === "user" ? "hidden" : "block")}>
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                        <Bot className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={cn(
                                        "rounded-2xl px-4 py-2.5 max-w-[85%] text-sm shadow-sm",
                                        m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground rounded-tl-sm border"
                                    )}
                                >
                                    {m.content.split("\n").map((line, j) => (
                                        <p key={j} className={cn(j > 0 && "mt-1")}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-purple-100 text-purple-600">
                                        <Bot className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-3 border shadow-sm flex items-center gap-1.5 h-10">
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} className="h-px w-full" />
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 bg-background border-t">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex gap-2 w-full"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                        <Send className="w-4 h-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
