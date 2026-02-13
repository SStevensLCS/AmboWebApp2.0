"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SignOutButtonProps {
    className?: string; // Allow custom styling for different contexts
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    fullWidth?: boolean;
    showIcon?: boolean;
    iconOnly?: boolean;
}

export function SignOutButton({
    className,
    variant = "ghost",
    fullWidth = false,
    showIcon = true,
    iconOnly = false
}: SignOutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/signout", {
                method: "POST",
            });

            if (res.ok) {
                // Force a hard refresh to clear any client-side state
                window.location.href = "/login";
            } else {
                console.error("Failed to sign out");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Sign out error:", error);
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            className={cn(
                "gap-2",
                fullWidth && "w-full justify-start",
                iconOnly && "justify-center p-2",
                className
            )}
            onClick={handleSignOut}
            disabled={isLoading}
        >
            {showIcon && <LogOut className="h-4 w-4" />}
            {!iconOnly && (isLoading ? "Signing out..." : "Sign Out")}
        </Button>
    );
}
