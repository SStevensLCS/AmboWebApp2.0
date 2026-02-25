"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, LogOut, UserCheck, FileText, Search } from "lucide-react";

const steps = [
  { label: "Account Created", icon: UserCheck, done: true },
  { label: "Application Submitted", icon: FileText, done: true },
  { label: "Under Review", icon: Search, done: false },
];

function StepItem({
  label,
  icon: Icon,
  done,
  index,
}: {
  label: string;
  icon: React.ElementType;
  done: boolean;
  index: number;
}) {
  const isLast = index === steps.length - 1;

  return (
    <motion.div
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15 }}
    >
      {/* Icon circle */}
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            done
              ? "bg-green-100 text-green-600"
              : "bg-sky-100 text-sky-600 animate-pulse"
          }`}
        >
          {done ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 h-8 mt-1 ${
              done ? "bg-green-200" : "bg-border"
            }`}
          />
        )}
      </div>

      {/* Label */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${done ? "text-green-600" : "text-sky-600"}`} />
          <span
            className={`text-sm font-medium ${
              done ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </span>
        </div>
        {!done && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            In progress
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function StatusPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mb-2">
              <Clock className="w-7 h-7 text-sky-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Application Status</CardTitle>
            <CardDescription>
              Your application is being reviewed by our team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress stepper */}
            <div className="space-y-0">
              {steps.map((step, i) => (
                <StepItem key={step.label} index={i} {...step} />
              ))}
            </div>

            {/* Info box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-muted/50 rounded-lg p-4 border"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Student Ambassador Coordinator will email you after the review period. No further action is needed from you right now.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Questions? Contact{" "}
                <a
                  href="mailto:sstevens@linfield.com"
                  className="text-primary font-medium hover:underline"
                >
                  sstevens@linfield.com
                </a>
              </p>
            </motion.div>

            {/* Sign out */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
