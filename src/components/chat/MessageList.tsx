"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: {
        first_name: string;
        last_name: string;
    }
};

interface MessageListProps {
    groupId: string;
    currentUserId: string;
}

export function MessageList({ groupId, currentUserId }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from("chat_messages")
                .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(first_name, last_name)
        `)
                .eq("group_id", groupId)
                .order("created_at", { ascending: true });

            if (!error && data) {
                // Cast data to match Message type (handling join properly)
                // Supabase returns array of objects. We need to help TS or cast.
                setMessages(data as any as Message[]);
                scrollToBottom();
            }
            setLoading(false);
        };

        fetchMessages();

        // Real-time subscription
        const channel = supabase
            .channel(`chat:${groupId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "chat_messages",
                    filter: `group_id=eq.${groupId}`,
                },
                async (payload) => {
                    const newMsg = payload.new as Message;

                    // Deduplicate: skip if this message already exists in state
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) {
                            return prev;
                        }

                        // We need to fetch sender info for the new message because payload doesn't have it
                        // Since setState is sync, we add the message first, then update with sender info
                        return [...prev, { ...newMsg, sender: { first_name: '...', last_name: '' } }];
                    });

                    // Fetch sender info and update the message
                    const { data: senderData } = await supabase
                        .from("users")
                        .select("first_name, last_name")
                        .eq("id", newMsg.sender_id)
                        .single();

                    if (senderData) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === newMsg.id
                                    ? { ...m, sender: senderData }
                                    : m
                            )
                        );
                    }

                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, supabase]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 100);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        const optimisticId = `optimistic-${Date.now()}`;

        // Optimistic update: show the message immediately
        const optimisticMsg: Message = {
            id: optimisticId,
            sender_id: currentUserId,
            content: messageContent,
            created_at: new Date().toISOString(),
            sender: { first_name: "You", last_name: "" },
        };
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessage("");
        scrollToBottom();

        setSending(true);
        try {
            const res = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId, content: messageContent }),
            });

            if (res.ok) {
                const data = await res.json();
                // Replace optimistic message with the real one from the server
                setMessages((prev) =>
                    prev.map((m) => m.id === optimisticId ? { ...data.message, sender: optimisticMsg.sender } : m)
                );
            } else {
                console.error("Failed to send message");
                // Remove optimistic message on failure
                setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
            }
        } catch (error) {
            console.error("Error sending message", error);
            // Remove optimistic message on failure
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center py-4 text-muted-foreground">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex flex-col max-w-[75%]",
                                        isMe ? "ml-auto items-end" : "items-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-sm",
                                            isMe
                                                ? "bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-muted rounded-bl-none"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {!isMe && msg.sender ? `${msg.sender.first_name} ` : ""}
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>
            <div className="p-4 border-t mt-auto">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
