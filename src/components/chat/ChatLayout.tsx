"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { MessageSquare, Loader2, ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { MessageList } from "./MessageList";
import { ChatSettingsDialog } from "./ChatSettingsDialog";
import { Group } from "./types";
import { useSearchParams, usePathname } from "next/navigation";

interface ChatLayoutProps {
    currentUserId: string;
    pageTitle?: string;
}

export function ChatLayout({ currentUserId, pageTitle }: ChatLayoutProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // ── Dynamic viewport height for mobile keyboard handling ──
    // On Safari PWA, CSS viewport units (dvh/vh) are unreliable when the
    // virtual keyboard opens. We use the visualViewport API to get the
    // actual visible height and size the container precisely.
    const [mobileStyle, setMobileStyle] = useState<React.CSSProperties | null>(null);
    const baseHeightRef = useRef(0);

    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        baseHeightRef.current = vv.height;

        // Read the mobile nav height from our CSS variable (includes safe-area-inset-bottom)
        const computedNavHeight =
            parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--mobile-nav-height")) || 80;

        const update = () => {
            // Only apply JS-driven height on mobile
            if (window.innerWidth >= 768) {
                setMobileStyle(null);
                return;
            }

            // Update baseline when the viewport grows (orientation change, keyboard fully closed)
            if (vv.height > baseHeightRef.current * 0.9) {
                baseHeightRef.current = Math.max(baseHeightRef.current, vv.height);
            }

            const isKeyboardOpen = vv.height < baseHeightRef.current * 0.75;
            // When keyboard is open, the bottom nav hides itself, so use full visible height.
            // When closed, subtract the nav height so the chat sits above the nav bar.
            const height = isKeyboardOpen ? vv.height : vv.height - computedNavHeight;

            setMobileStyle({
                height: `${height}px`,
                top: `${vv.offsetTop}px`, // follow Safari auto-scroll offset
            });
        };

        update();
        vv.addEventListener("resize", update);
        vv.addEventListener("scroll", update);
        window.addEventListener("resize", update);
        return () => {
            vv.removeEventListener("resize", update);
            vv.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    // Sync with URL param
    useEffect(() => {
        const groupId = searchParams.get("group");
        if (groupId) setSelectedGroupId(groupId);
    }, [searchParams]);

    const selectGroup = (id: string) => {
        setSelectedGroupId(id || null);
        // Use history.replaceState instead of router.replace to avoid triggering
        // a Next.js soft navigation. Soft navigation re-executes the server
        // component, and the loading.tsx Suspense boundary unmounts ChatLayout,
        // destroying all client state (groups, selectedGroupId). On mobile this
        // leaves the user stuck on "Select a chat" with no back button.
        const params = new URLSearchParams(window.location.search);
        if (id) {
            params.set("group", id);
        } else {
            params.delete("group");
        }
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    };

    const fetchGroups = async () => {
        setLoading(true);
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

    return (
        <div
            className="fixed inset-x-0 top-0 z-30 md:relative md:inset-auto md:z-auto flex md:border md:rounded-lg overflow-hidden bg-background"
            style={
                mobileStyle ?? { height: "calc(100dvh - 4rem - env(safe-area-inset-bottom, 0px))" }
            }
        >
            {/* Sidebar - Visible on Desktop, or on Mobile when no chat selected */}
            <div className={cn(
                "w-full md:w-80 flex-col",
                selectedGroupId ? "hidden md:flex" : "flex"
            )}>
                <div className="flex flex-col h-full border-r bg-background">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            {pageTitle && (
                                <p className="text-xs text-muted-foreground leading-none mb-1">{pageTitle}</p>
                            )}
                            <h2 className="font-semibold text-lg leading-none">Chats</h2>
                        </div>
                        <CreateGroupDialog onGroupCreated={(id, groupData) => {
                            // Optimistically add the new group to state so it's
                            // available immediately — avoids RLS/timing issues where
                            // the browser Supabase client can't see the new group yet
                            // (e.g. Safari PWA with isolated cookie context)
                            const optimisticGroup: Group = {
                                id,
                                name: groupData.name,
                                created_by: groupData.created_by,
                                created_at: groupData.created_at,
                                participants: groupData.participants.map(u => ({ user: u })),
                            };
                            setGroups(prev => [optimisticGroup, ...prev]);
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
            </div>

            {/* Main Content - Visible on Desktop, or on Mobile when chat selected */}
            <div className={cn(
                "flex-1 flex-col min-w-0 bg-background",
                selectedGroupId ? "flex" : "hidden md:flex"
            )}>
                {selectedGroupId && selectedGroup ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Chat header - always pinned at top */}
                        <div className="shrink-0 border-b bg-background z-10">
                            <div className="flex items-center justify-between px-3 h-14">
                                <div className="flex items-center gap-1 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden shrink-0 -ml-1 h-9 w-9"
                                        onClick={() => selectGroup("")}
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    <h3 className="font-semibold truncate text-base">
                                        {selectedGroup.name || "Chat"}
                                    </h3>
                                </div>
                                <ChatSettingsDialog
                                    group={selectedGroup}
                                    currentUserId={currentUserId}
                                    onUpdate={fetchGroups}
                                />
                            </div>
                        </div>

                        {/* Messages + Input area - fills remaining space */}
                        <div className="flex-1 min-h-0">
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
