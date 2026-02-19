"use client";

import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
    steps: string[];
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
    return (
        <div className="w-full mb-8">
            {/* Percentage Progress Bar */}
            <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-muted-foreground font-medium">
                    Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-brand font-semibold">
                    {Math.round(((currentStep + 1) / totalSteps) * 100)}% Completed
                </span>
            </div>
            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-brand rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            {/* Steps Label - Optional, maybe hide on mobile or show current only */}
            <div className="mt-4 flex justify-between relative">
                {/* Line connecting dots - visual only */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-secondary -translate-y-1/2 -z-10 hidden sm:block" />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div
                            key={step}
                            className={cn(
                                "flex flex-col items-center gap-2 relative z-0",
                                index > currentStep && "opacity-50"
                            )}
                        >
                            <motion.div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors bg-surface",
                                    isCompleted ? "border-brand bg-brand text-white" :
                                        isCurrent ? "border-brand text-brand" : "border-border text-muted-foreground"
                                )}
                                initial={false}
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                    borderColor: isCompleted || isCurrent ? "var(--brand)" : "hsl(var(--border))"
                                }}
                            >
                                {isCompleted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                    index + 1
                                )}
                            </motion.div>
                            <span className={cn(
                                "text-[10px] uppercase tracking-wider font-semibold hidden sm:block text-center max-w-[80px]",
                                isCurrent ? "text-brand" : "text-muted-foreground"
                            )}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
