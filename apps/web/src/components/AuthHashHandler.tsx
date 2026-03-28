"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Handles Supabase implicit-flow auth tokens that arrive as URL hash fragments
 * AND role-based redirects for already-authenticated users.
 *
 * This component ALWAYS renders on the root page — even when the user has an
 * active session — because hash fragments (#access_token=...&type=recovery)
 * are invisible to the server. Without this, a logged-in user clicking a
 * password-reset link would get redirected to their dashboard instead of
 * /reset-password, because the server can't see the recovery token in the hash.
 */
export default function AuthHashHandler({
  sessionRole,
}: {
  sessionRole: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    async function handleHash() {
      const hash = window.location.hash.slice(1); // strip leading '#'

      if (hash) {
        const params = new URLSearchParams(hash);
        const errorCode = params.get("error_code");

        // Link expired or otherwise invalid — send user back to request a new one
        if (errorCode) {
          router.replace("/forgot-password");
          return;
        }

        const type = params.get("type");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (type === "recovery" && accessToken && refreshToken) {
          const supabase = createClient();
          // Establish the Supabase session (stored in cookies by @supabase/ssr
          // so the reset-password page's updateUser call can use it)
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("setSession error:", error);
            router.replace("/forgot-password");
            return;
          }

          router.replace("/reset-password");
          return;
        }
      }

      // No recovery tokens in hash — do role-based redirect or go to login
      if (sessionRole) {
        switch (sessionRole) {
          case "basic":
            router.replace("/apply");
            break;
          case "applicant":
            router.replace("/status");
            break;
          case "admin":
          case "superadmin":
            router.replace("/admin");
            break;
          default:
            router.replace("/student");
            break;
        }
      } else {
        router.replace("/login");
      }
    }

    handleHash();
  }, [router, sessionRole]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
