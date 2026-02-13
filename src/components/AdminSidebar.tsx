"use client";

import { LayoutDashboard, Calendar, MessageSquare, FileText } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";

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

    return <Sidebar items={navItems} className="hidden md:block" footer={<SignOutButton fullWidth className="text-muted-foreground hover:text-red-500 hover:bg-red-50" />} />;
}
