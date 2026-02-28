"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Handles Supabase implicit-flow auth tokens that arrive as URL hash fragments.
 *
 * Supabase sends password-reset emails using the implicit flow when the
 * redirectTo URL isn't in the project's allowlist. The tokens land at the
 * root URL as a hash (e.g. /#access_token=...&type=recovery). Hash fragments
 * are never sent to the server, so we must parse them client-side here.
 */
export default function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    async function handleHash() {
      const hash = window.location.hash.slice(1); // strip leading '#'

      if (!hash) {
        router.replace("/login");
        return;
      }

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

      // Unknown hash — fall through to login
      router.replace("/login");
    }

    handleHash();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
