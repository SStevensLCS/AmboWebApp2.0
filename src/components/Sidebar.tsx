"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Image from "next/image";

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

    return (
        <div className={cn("pb-12 min-h-screen w-64 border-r bg-background hidden md:block", className)} {...props}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    {header || (
                        <div className="flex items-center px-4 mb-4">
                            <div className="relative w-10 h-10 mr-2">
                                {/* Placeholder for Logo, using a text fallback if no image provided in header */}\n                                  <span className="font-bold text-xl">Ambo</span>
                            </div>
                        </div>
                    )}
                    <div className="space-y-1">
                        {items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>
            {footer && <div className="absolute bottom-4 px-4 w-full">{footer}</div>}
        </div>
    );
}

// We need Button specific to Sidebar look? 
// Standard Button variant="ghost" works well.
import { Button } from "@/components/ui/button";
