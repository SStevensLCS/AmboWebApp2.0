"use client";

import { LayoutDashboard, Calendar, MessageSquare, FileText } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export function AdminSidebar() {
    const navItems = [
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
            href: "/admin/resources",
            label: "Resources",
            icon: FileText,
        },
    ];

    return <Sidebar items={navItems} className="hidden md:block" />;
}
