"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
    sender?: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
    }
};

interface MessageListProps {
    groupId: string;
    currentUserId: string;
}

export function MessageList({ groupId, currentUserId }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputEmpty, setInputEmpty] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const supabase = useMemo(() => createClient(), []);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, []);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/chat/messages?groupId=${groupId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages as Message[]);
                    scrollToBottom();
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
            setLoading(false);
        };

        fetchMessages();

        // Real-time subscription for new messages
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

                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) {
                            return prev;
                        }
                        return [...prev, { ...newMsg, sender: { first_name: '...', last_name: '' } }];
                    });

                    // Fetch sender info via API
                    try {
                        const res = await fetch(`/api/chat/users`);
                        if (res.ok) {
                            const data = await res.json();
                            const sender = data.users?.find?.((u: { id: string }) => u.id === newMsg.sender_id);
                            if (sender) {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === newMsg.id
                                            ? { ...m, sender: { first_name: sender.first_name, last_name: sender.last_name, avatar_url: sender.avatar_url } }
                                            : m
                                    )
                                );
                            }
                        }
                    } catch {
                        // Sender lookup is best-effort
                    }

                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, supabase, scrollToBottom]);

    const getInputText = (): string => {
        return inputRef.current?.textContent?.trim() || "";
    };

    const clearInput = () => {
        if (inputRef.current) {
            inputRef.current.textContent = "";
            setInputEmpty(true);
        }
    };

    const handleSend = async () => {
        const messageContent = getInputText();
        if (!messageContent || sending) return;

        clearInput();
        inputRef.current?.focus();

        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticMsg: Message = {
            id: optimisticId,
            sender_id: currentUserId,
            content: messageContent,
            created_at: new Date().toISOString(),
            sender: { first_name: "You", last_name: "" },
        };
        setMessages((prev) => [...prev, optimisticMsg]);
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
                setMessages((prev) => {
                    const realMessageId = data.message.id;
                    const alreadyExists = prev.some((m) => m.id === realMessageId);

                    if (alreadyExists) {
                        return prev.filter((m) => m.id !== optimisticId);
                    }

                    return prev.map((m) =>
                        m.id === optimisticId
                            ? { ...data.message, sender: optimisticMsg.sender }
                            : m
                    );
                });
            } else {
                console.error("Failed to send message");
                setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
            }
        } catch (error) {
            console.error("Error sending message", error);
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = () => {
        setInputEmpty(!getInputText());
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages area - native scroll for best mobile keyboard behavior */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
                <div className="px-4 py-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex justify-center py-8 text-muted-foreground text-sm">
                            No messages yet. Start the conversation!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === currentUserId;
                                const initials = `${(msg.sender?.first_name || "?")[0]}${(msg.sender?.last_name || "")[0] || ""}`.toUpperCase();
                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex",
                                            isMe ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {!isMe && (
                                            <Avatar className="h-7 w-7 mt-5 mr-2 shrink-0">
                                                {msg.sender?.avatar_url && <AvatarImage src={msg.sender.avatar_url} className="object-cover" />}
                                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "flex flex-col max-w-[80%]",
                                            isMe ? "items-end" : "items-start"
                                        )}>
                                            {!isMe && msg.sender && (
                                                <span className="text-[11px] text-muted-foreground mb-0.5 px-3 font-medium">
                                                    {msg.sender.first_name}
                                                </span>
                                            )}
                                            <div
                                                className={cn(
                                                    "px-3.5 py-2 text-sm leading-relaxed",
                                                    isMe
                                                        ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-[4px]"
                                                        : "bg-muted rounded-[18px] rounded-bl-[4px]"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground mt-0.5 px-3">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input bar - minimal chrome, sits flush above keyboard */}
            <div className="shrink-0 bg-background border-t px-3 py-2">
                <div className="flex items-end gap-2">
                    <div
                        ref={inputRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="chat-editable-input flex-1 min-h-[36px] max-h-[100px] overflow-y-auto rounded-full bg-muted px-4 py-2 text-sm outline-none leading-relaxed"
                        data-placeholder="Message"
                        enterKeyHint="send"
                        onKeyDown={handleKeyDown}
                        onInput={handleInput}
                        onPaste={handlePaste}
                        role="textbox"
                        aria-label="Message input"
                    />
                    <Button
                        size="icon"
                        className="rounded-full h-9 w-9 shrink-0"
                        disabled={sending || inputEmpty}
                        onClick={handleSend}
                    >
                        {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
