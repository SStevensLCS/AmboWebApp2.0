"use client";

import { useState, useRef, useEffect } from "react";

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

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <div className="glass-panel p-0 h-[420px] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="chat-bubble-ai text-sm" style={{ opacity: 0.5 }}>
                            ...
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
            <div className="border-t border-[var(--border)] p-3 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Describe your event..."
                    className="glass-input text-sm"
                    disabled={loading}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="glass-btn-primary py-2 px-4 text-sm"
                >
                    →
                </button>
            </div>
        </div>
    );
}
