"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, MessageSquare, ClipboardList, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminMobileBottomNav() {
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Store the viewport height captured before any keyboard opens.
  // On iOS Safari, window.innerHeight tracks the visual viewport (shrinks with
  // keyboard), so we can't use it as a stable baseline — hence the ref.
  const baseHeightRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const viewport = window.visualViewport;
    baseHeightRef.current = viewport.height;

    const handleViewportChange = () => {
      setKeyboardVisible(viewport.height < baseHeightRef.current * 0.75);
    };

    viewport.addEventListener("resize", handleViewportChange);
    return () => viewport.removeEventListener("resize", handleViewportChange);
  }, []);

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
      href: "/admin/applications",
      label: "Apply",
      icon: ClipboardList,
    },
    {
      href: "/admin/chat",
      label: "Chat",
      icon: MessageCircle,
    },
  ];

  if (keyboardVisible) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t shadow-lg md:hidden pb-safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className="h-6 w-6 transition-transform"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
