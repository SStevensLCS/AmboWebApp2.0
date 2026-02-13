"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SidebarItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    items: SidebarItem[];
    header?: React.ReactNode;
    footer?: React.ReactNode;
}

export function Sidebar({ className, items, header, footer, ...props }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "relative flex flex-col min-h-screen border-r border-border/40 bg-background transition-all duration-300 ease-in-out",
                isCollapsed ? "w-16" : "w-64",
                "hidden md:flex",
                className
            )}
            {...props}
        >
            {/* Toggle Button */}
            <div className="absolute -right-3 top-6 z-20">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-full border shadow-md bg-background hover:bg-accent"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </Button>
            </div>

            <div className="flex-1 py-4">
                <div className={cn("px-3 py-2", isCollapsed ? "px-2" : "px-3")}>
                    {/* Header / Logo */}
                    <div className={cn("flex items-center mb-6 px-2", isCollapsed ? "justify-center" : "")}>
                        {header ? header : (
                            isCollapsed ? (
                                <span className="font-bold text-xl">A</span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {/* <div className="w-6 h-6 bg-primary rounded-full" /> Placeholder logo */}
                                    <span className="font-bold text-xl">Ambo</span>
                                </div>
                            )
                        )}
                    </div>

                    <nav className="space-y-1">
                        {items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start transition-all",
                                        isCollapsed ? "justify-center px-2" : "px-4",
                                        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                    title={isCollapsed ? item.label : undefined}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 mt-auto border-t border-border/40">
                {!isCollapsed && footer}
            </div>
        </div>
    );
}
