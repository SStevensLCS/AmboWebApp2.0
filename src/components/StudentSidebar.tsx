"use client";

import { LayoutDashboard, Calendar, PlusCircle, MessageSquare, UserCircle, FileText, MessageCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";

export function StudentSidebar() {
    const navItems = [
        {
            href: "/student",
            label: "Home",
            icon: LayoutDashboard,
        },
        {
            href: "/student/events",
            label: "Events",
            icon: Calendar,
        },
        {
            href: "/student/events/new",
            label: "Log Service",
            icon: PlusCircle,
        },
        {
            href: "/student/posts",
            label: "Posts",
            icon: MessageSquare,
        },
        {
            href: "/student/chat",
            label: "Chat",
            icon: MessageCircle,
        },
        {
            href: "/student/resources",
            label: "Resources",
            icon: FileText,
        },
        {
            href: "/student/profile",
            label: "Profile",
            icon: UserCircle,
        },
    ];

    return <Sidebar items={navItems} className="hidden md:block" footer={<SignOutButton fullWidth className="text-muted-foreground hover:text-red-500 hover:bg-red-50" />} />;
}
