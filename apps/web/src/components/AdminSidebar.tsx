"use client";

import { LayoutDashboard, Calendar, MessageSquare, MessageCircle, UserCircle } from "lucide-react";
import { Sidebar, SidebarItem } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";

export function AdminSidebar() {
    const navItems: SidebarItem[] = [
        {
            href: "/admin",
            label: "Dashboard",
            icon: LayoutDashboard,
        },
        {
            href: "/admin/events",
            label: "Events",
            icon: Calendar,
        },
        {
            href: "/admin/posts",
            label: "Posts",
            icon: MessageSquare,
        },
        {
            href: "/admin/chat",
            label: "Chat",
            icon: MessageCircle,
        },
        {
            href: "/admin/profile",
            label: "Profile",
            icon: UserCircle,
        },
    ];

    return <Sidebar items={navItems} className="hidden md:block" footer={<SignOutButton fullWidth className="text-muted-foreground hover:text-red-500 hover:bg-red-50" />} />;
}
