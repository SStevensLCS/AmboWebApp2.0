"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Send, Bot, Sparkles, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
    role: "user" | "ai";
    content: string;
    id: number;
};

type EventFields = {
    event_name: string | null;
    hours: number | null;
    tour_credits: number | null;
    notes: string | null;
};

let messageIdCounter = 0;

const bubbleVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
    },
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
            id: messageIdCounter++,
        },
    ]);
    const [inputEmpty, setInputEmpty] = useState(true);
    const inputRef = useRef<HTMLDivElement>(null);
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
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // ── Track visualViewport height for mobile keyboard handling ──
    // Sets --app-height CSS variable so .chat-container can size correctly
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const update = () => {
            document.documentElement.style.setProperty("--app-height", `${vv.height}px`);
        };

        update();
        vv.addEventListener("resize", update);
        return () => {
            vv.removeEventListener("resize", update);
            document.documentElement.style.removeProperty("--app-height");
        };
    }, []);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            const viewport = scrollAreaRef.current?.querySelector(
                "[data-radix-scroll-area-viewport]"
            );
            if (viewport) {
                viewport.scrollTo({
                    top: viewport.scrollHeight,
                    behavior: "smooth",
                });
            }
        });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, scrollToBottom]);

    const getInputText = (): string =>
        inputRef.current?.textContent?.trim() || "";

    const clearInput = () => {
        if (inputRef.current) {
            inputRef.current.textContent = "";
            setInputEmpty(true);
        }
    };

    const handleSend = async () => {
        const userMsg = getInputText();
        if (!userMsg || loading) return;
        setMessages((prev) => [
            ...prev,
            { role: "user", content: userMsg, id: messageIdCounter++ },
        ]);
        clearInput();
        inputRef.current?.focus();
        setLoading(true);

        // Handle confirmation
        if (awaitingConfirm) {
            if (userMsg.toLowerCase().startsWith("y")) {
                await submitEvent();
            } else {
                setAwaitingConfirm(false);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content: "No problem. What would you like to change?",
                        id: messageIdCounter++,
                    },
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
                if (data.fields.event_name)
                    merged.event_name = data.fields.event_name;
                if (data.fields.hours != null)
                    merged.hours = data.fields.hours;
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
                        id: messageIdCounter++,
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content:
                            data.message || "Could you tell me more?",
                        id: messageIdCounter++,
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "Sorry, I had trouble processing that. Could you try again?",
                    id: messageIdCounter++,
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
                    {
                        role: "ai",
                        content: "Submitted! ✓",
                        id: messageIdCounter++,
                    },
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
                    {
                        role: "ai",
                        content:
                            "Something went wrong submitting. Try again?",
                        id: messageIdCounter++,
                    },
                ]);
                setAwaitingConfirm(false);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: "Network error. Try again?",
                    id: messageIdCounter++,
                },
            ]);
            setAwaitingConfirm(false);
        }
    };

    return (
        <Card className="chat-container shadow-md border-border/60">
            {/* ── Header (pinned) ── */}
            <CardHeader className="shrink-0 px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    Assistant
                </CardTitle>
            </CardHeader>

            {/* ── Messages (scrollable) ── */}
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="bg-slate-50/50 min-h-full px-4 py-4 space-y-3">
                        <AnimatePresence initial={false}>
                            {messages.map((m) => (
                                <motion.div
                                    key={m.id}
                                    variants={bubbleVariants}
                                    initial="hidden"
                                    animate="visible"
                                    layout
                                    className={cn(
                                        "flex gap-2.5",
                                        m.role === "user"
                                            ? "flex-row-reverse"
                                            : "flex-row"
                                    )}
                                >
                                    {/* Avatar */}
                                    <Avatar
                                        className={cn(
                                            "h-8 w-8 shrink-0 mt-0.5",
                                            m.role === "user"
                                                ? "bg-primary"
                                                : "bg-primary/10"
                                        )}
                                    >
                                        <AvatarFallback
                                            className={cn(
                                                m.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-primary/10 text-primary"
                                            )}
                                        >
                                            {m.role === "user" ? (
                                                <User className="h-4 w-4" />
                                            ) : (
                                                <Bot className="h-4 w-4" />
                                            )}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Bubble */}
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm leading-relaxed shadow-sm",
                                            m.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-background text-foreground rounded-tl-none border border-border/60"
                                        )}
                                    >
                                        {m.content
                                            .split("\n")
                                            .map((line, j) => (
                                                <p
                                                    key={j}
                                                    className={cn(
                                                        j > 0 && "mt-1.5"
                                                    )}
                                                >
                                                    {line}
                                                </p>
                                            ))}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Typing indicator */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="flex gap-2.5"
                                >
                                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-background text-foreground rounded-2xl rounded-tl-none px-4 py-3 border border-border/60 shadow-sm flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </ScrollArea>
            </CardContent>

            {/* ── Input bar (pinned) ── */}
            <CardFooter className="shrink-0 p-3 bg-background border-t">
                <div className="flex gap-2 w-full items-end">
                    <div
                        ref={inputRef}
                        contentEditable={!loading}
                        suppressContentEditableWarning
                        className="chat-editable-input flex-1 min-h-[36px] max-h-[100px] overflow-y-auto rounded-full bg-muted px-4 py-2 text-sm outline-none leading-relaxed"
                        data-placeholder="Type a message..."
                        enterKeyHint="send"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        onInput={() => setInputEmpty(!getInputText())}
                        onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData.getData("text/plain");
                            document.execCommand("insertText", false, text);
                        }}
                        role="textbox"
                        aria-label="Message input"
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-full"
                        disabled={loading || inputEmpty}
                        onClick={handleSend}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
