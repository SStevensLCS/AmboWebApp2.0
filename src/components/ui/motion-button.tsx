"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends Omit<HTMLMotionProps<"button">, "variant" | "size">, // Omit to avoid conflicts
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const MotionButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // If we're using 'asChild', we can't easily merge motion behavior directly
        // onto the Slot without wrapping it or passing props carefully.
        // For simplicity, we'll assume MotionButton is usually a button itself.
        // However, if asChild is true, we fallback to just Slot without motion (or we'd need motion(Slot)).
        // Given the request is for animations, let's stick to motion.button implementation primarily.

        if (asChild) {
            // If the user wants to substitute the element, we can't guarantee motion behavior on the child easily
            // without creating a motion(Slot) component or similar.
            // For now, let's just return a Slot but warn/note that motion props might not apply correctly
            // unless the child handles them. Actually, let's keep it simple: MotionButton is for button elements.
            const Comp = Slot;
            return (
                <Comp
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                />
            );
        }

        return (
            <motion.button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                {...props}
            />
        );
    }
);
MotionButton.displayName = "MotionButton";

export { MotionButton, buttonVariants };
