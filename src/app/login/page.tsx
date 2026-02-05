"use client";

import { useState } from "react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.redirect) {
        window.location.href = data.redirect;
        return;
      }

      setError(
        data.error ||
          `Something went wrong (${res.status}). Please try again.`
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please try again."
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-navy mb-1">
          Ambassador Portal
        </h1>
        <p className="text-navy/70 text-sm mb-8">
          Sign in with your 10-digit phone number
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-navy/20 text-navy placeholder:text-navy/50 focus:outline-none focus:ring-2 focus:ring-sky-blue focus:border-transparent"
          />
          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-navy text-white font-medium hover:bg-navy/90 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
