"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { MessageList } from "./MessageList";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { Group } from "./types";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface ChatLayoutProps {
    currentUserId: string;
}

export function ChatLayout({ currentUserId }: ChatLayoutProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const supabase = createClient();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Sync with URL param
    useEffect(() => {
        const groupId = searchParams.get("group");
        if (groupId) setSelectedGroupId(groupId);
    }, [searchParams]);

    const selectGroup = (id: string) => {
        setSelectedGroupId(id);
        const params = new URLSearchParams(searchParams);
        params.set("group", id);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const fetchGroups = async () => {
        setLoading(true);
        // Fetch groups I am a participant of
        const { data: participations, error } = await supabase
            .from("chat_participants")
            .select("group_id")
            .eq("user_id", currentUserId);

        if (error || !participations) {
            console.error("Error fetching participations", error);
            setLoading(false);
            return;
        }

        const groupIds = participations.map(p => p.group_id);

        if (groupIds.length > 0) {
            const { data: groupsData, error: groupsError } = await supabase
                .from("chat_groups")
                .select(`
            *,
            participants:chat_participants(
                user:users(id, first_name, last_name, email)
            )
        `)
                .in("id", groupIds)
                .order("updated_at", { ascending: false });

            if (groupsData) {
                setGroups(groupsData as any as Group[]);
            }
        } else {
            setGroups([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchGroups();
    }, [currentUserId, supabase]);

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    const SidebarContent = () => (
        <div className="flex flex-col h-full border-r bg-background">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-lg">Chats</h2>
                <CreateGroupDialog onGroupCreated={(id) => {
                    fetchGroups();
                    selectGroup(id);
                }} />
            </div>
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        No chats yet. Start one!
                    </div>
                ) : (
                    <div className="flex flex-col gap-1 p-2">
                        {groups.map((group) => {
                            let displayName = group.name;
                            if (!displayName && group.participants) {
                                const others = group.participants
                                    .filter(p => p.user && p.user.id !== currentUserId)
                                    .map(p => p.user.first_name);
                                displayName = others.length > 0 ? others.slice(0, 2).join(", ") + (others.length > 2 ? ` +${others.length - 2}` : "") : "Empty Group";
                            }

                            return (
                                <Button
                                    key={group.id}
                                    variant={selectedGroupId === group.id ? "secondary" : "ghost"}
                                    className={cn(
                                        "justify-start h-auto py-3 px-4 w-full",
                                        selectedGroupId === group.id && "bg-muted"
                                    )}
                                    onClick={() => selectGroup(group.id)}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                                    <div className="overflow-hidden text-left w-full">
                                        <div className="font-medium truncate">{displayName}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {new Date(group.updated_at || group.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex h-[calc(100dvh-4rem)] border rounded-lg overflow-hidden bg-background">
            {/* Sidebar - Visible on Desktop, or on Mobile when no chat selected */}
            <div className={cn(
                "w-full md:w-80 flex-col",
                selectedGroupId ? "hidden md:flex" : "flex"
            )}>
                <SidebarContent />
            </div>

            {/* Main Content - Visible on Desktop, or on Mobile when chat selected */}
            <div className={cn(
                "flex-1 flex-col min-w-0 bg-background",
                selectedGroupId ? "flex" : "hidden md:flex"
            )}>
                {selectedGroupId && selectedGroup ? (
                    <div className="flex flex-col h-full">
                        <div className="border-b p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={() => selectGroup("")} // Clear selection
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                                <h3 className="font-semibold truncate max-w-[200px] md:max-w-md">
                                    {selectedGroup.name || "Chat"}
                                </h3>
                            </div>
                            <ChatSettingsDialog
                                group={selectedGroup}
                                currentUserId={currentUserId}
                                onUpdate={fetchGroups}
                            />
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <MessageList groupId={selectedGroupId} currentUserId={currentUserId} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
                        Select a chat to start messaging
                    </div>
                )}
            </div>
        </div>
    );
}
