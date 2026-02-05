"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_TYPES } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);

export function NewSubmissionForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState<{
    service_date: string;
    service_type: string;
    credits: number;
    hours: number;
  } | null>(null);
  const [error, setError] = useState("");

  const [service_date, setService_date] = useState(today);
  const [service_type, setService_type] = useState<(typeof SERVICE_TYPES)[number]>(SERVICE_TYPES[0]);
  const [credits, setCredits] = useState("");
  const [hours, setHours] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const creditsNum = parseFloat(credits) || 0;
    const hoursNum = parseFloat(hours) || 0;

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          service_date,
          service_type,
          credits: creditsNum,
          hours: hoursNum,
          feedback: feedback.trim() || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to submit.");
        setLoading(false);
        return;
      }

      setSummary({ service_date, service_type, credits: creditsNum, hours: hoursNum });
      setSuccess(true);
    } catch {
      setError("Something went wrong.");
    }
    setLoading(false);
  };

  if (success && summary) {
    return (
      <div className="rounded-xl bg-navy/5 border border-navy/10 p-4 space-y-2">
        <h2 className="font-semibold text-navy">Submission received</h2>
        <p className="text-sm text-navy/80">
          Date: {summary.service_date} · {summary.service_type}
        </p>
        <p className="text-sm text-navy/80">
          Hours: {summary.hours} · Tour credits: {summary.credits}
        </p>
        <button
          type="button"
          onClick={() => router.push("/student/history")}
          className="mt-4 py-2 px-4 rounded-lg bg-navy text-white"
        >
          View history
        </button>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setSummary(null);
            setCredits("");
            setHours("");
            setFeedback("");
            setService_date(today);
          }}
          className="ml-2 py-2 px-4 rounded-lg border border-navy text-navy"
        >
          Add another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-navy mb-1">
          Service Date
        </label>
        <input
          type="date"
          value={service_date}
          onChange={(e) => setService_date(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-navy/20 text-navy"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">
          Service Type
        </label>
        <select
          value={service_type}
          onChange={(e) => setService_type(e.target.value as (typeof SERVICE_TYPES)[number])}
          className="w-full px-4 py-2 rounded-lg border border-navy/20 text-navy"
        >
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">
          Tour Credits
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-navy/20 text-navy"
          required
        />
        <p className="text-xs text-navy/60 mt-1">
          NOTE: Family tours are 1, Campus Preview Day is 1, & anything else is 0
          unless specified.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">
          Hours Served
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-navy/20 text-navy"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">
          Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-navy/20 text-navy resize-none"
          placeholder="Optional"
        />
        <p className="text-xs text-navy/60 mt-1">
          NOTE: If you had any strange, negative, or positive interactions,
          please provide that here.
        </p>
      </div>

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-navy text-white font-medium disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
