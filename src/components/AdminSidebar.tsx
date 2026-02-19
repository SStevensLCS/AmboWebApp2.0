"use client";

import { LayoutDashboard, Calendar, MessageSquare, FileText, ClipboardList, Users, MessageCircle } from "lucide-react";
import { Sidebar, SidebarItem } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";

export function AdminSidebar() {
    const navItems: SidebarItem[] = [
        {
            type: "header",
            label: "My Team"
        },
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
        {
            type: "header",
            label: "Recruitment"
        },
        {
            href: "/admin/applications",
            label: "Applications",
            icon: ClipboardList,
        },
        {
            href: "/admin/applicants",
            label: "Applicants",
            icon: Users,
        },
        {
            type: "header",
            label: "Communication"
        },
        {
            href: "/admin/chat",
            label: "Chat",
            icon: MessageCircle,
        }
    ];

    return <Sidebar items={navItems} className="hidden md:block" footer={<SignOutButton fullWidth className="text-muted-foreground hover:text-red-500 hover:bg-red-50" />} />;
}
