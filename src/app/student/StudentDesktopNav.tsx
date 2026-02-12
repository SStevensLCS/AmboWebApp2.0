"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, PlusCircle, MessageSquare, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudentDesktopNav() {
    const pathname = usePathname();

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
            href: "/student/profile",
            label: "Profile",
            icon: UserCircle,
        },
    ];

    return (
        <nav className="flex items-center gap-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all",
                            isActive ? "bg-accent/50 text-accent-foreground" : "transparent text-muted-foreground"
                        )}
                    >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
