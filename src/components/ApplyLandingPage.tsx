"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardList, RotateCcw, ArrowRight, Loader2 } from "lucide-react";
import { deleteApplication } from "@/actions/application";
import { SignOutButton } from "@/components/SignOutButton";

interface ApplyLandingPageProps {
    hasApplication: boolean;
    currentStep: number;
    totalSteps: number;
    phone: string;
}

export default function ApplyLandingPage({ hasApplication, currentStep, totalSteps, phone }: ApplyLandingPageProps) {
    const router = useRouter();
    const [isRestarting, setIsRestarting] = useState(false);

    const handleRestart = async () => {
        if (!confirm("Are you sure you want to restart your application? All previously saved answers will be deleted.")) {
            return;
        }

        setIsRestarting(true);
        try {
            await deleteApplication(phone);
            router.push("/apply/form");
        } catch (error) {
            console.error(error);
            alert("Failed to restart application. Please try again.");
            setIsRestarting(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-lg w-full"
            >
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-md">
                        <ClipboardList className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Student Ambassador Program</h1>
                    <p className="text-muted-foreground">
                        {hasApplication
                            ? "You have a saved application in progress."
                            : "Ready to apply? Start your application below."
                        }
                    </p>
                </div>

                <div className="bg-card border shadow-sm rounded-xl p-6 space-y-4">
                    {hasApplication ? (
                        <>
                            <div className="bg-muted/50 rounded-lg p-4 mb-2">
                                <p className="text-sm text-muted-foreground">
                                    Application progress: Step {currentStep} of {totalSteps}
                                </p>
                                <div className="w-full bg-secondary rounded-full h-2 mt-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.round(((currentStep - 1) / totalSteps) * 100)}%` }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="bg-primary h-full rounded-full"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-base"
                                onClick={() => router.push("/apply/form?resume=true")}
                            >
                                Resume Application <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full h-12 text-base"
                                onClick={handleRestart}
                                disabled={isRestarting}
                            >
                                {isRestarting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restarting...</>
                                ) : (
                                    <><RotateCcw className="w-4 h-4 mr-2" /> Restart Application</>
                                )}
                            </Button>
                        </>
                    ) : (
                        <Button
                            className="w-full h-12 text-base"
                            onClick={() => router.push("/apply/form")}
                        >
                            Apply to become a Student Ambassador <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <SignOutButton variant="ghost" className="text-muted-foreground text-sm" />
                </div>
            </motion.div>
        </div>
    );
}
