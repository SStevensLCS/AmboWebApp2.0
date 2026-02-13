"use client";

import { LayoutDashboard, Calendar, PlusCircle, MessageSquare, UserCircle, FileText } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

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

    return <Sidebar items={navItems} className="hidden md:block" />;
}
