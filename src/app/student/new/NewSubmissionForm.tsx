"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewSubmissionForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    event_title: "",
    hours: "",
    tour_credits: "",
    notes: "",
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const hours = parseFloat(form.hours);
    const credits = parseInt(form.tour_credits, 10);

    if (!form.event_title.trim()) {
      setError("Event title is required.");
      setLoading(false);
      return;
    }
    if (isNaN(hours) || hours <= 0) {
      setError("Please enter valid hours.");
      setLoading(false);
      return;
    }
    if (isNaN(credits) || credits < 0) {
      setError("Tour credits must be a whole number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          service_type: form.event_title.trim(),
          hours,
          credits,
          service_date: new Date().toISOString().split("T")[0],
          feedback: form.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Submission failed.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="glass-panel p-6 space-y-4 text-center animate-fade-in">
        <p className="text-lg">Submitted ✓</p>
        <p className="text-sm text-[var(--text-secondary)]">
          Your service hours have been logged.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setForm({ event_title: "", hours: "", tour_credits: "", notes: "" });
            }}
            className="glass-btn-primary py-2 px-4 text-sm"
          >
            Log Another
          </button>
          <button
            onClick={() => router.push("/student/history")}
            className="glass-btn-secondary py-2 px-4 text-sm"
          >
            View History
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-5 space-y-4 animate-fade-in">
      <div>
        <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
          Event Title
        </label>
        <input
          type="text"
          value={form.event_title}
          onChange={(e) => update("event_title", e.target.value)}
          placeholder="e.g. Family Tour, Campus Preview Day"
          className="glass-input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
            Hours Served
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.hours}
            onChange={(e) => update("hours", e.target.value)}
            placeholder="2"
            className="glass-input"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
            Tour Credits
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={form.tour_credits}
            onChange={(e) => update("tour_credits", e.target.value)}
            placeholder="1"
            className="glass-input"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-widest mb-1">
          Notes / Feedback
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="How did the event go?"
          rows={3}
          className="glass-input resize-none"
        />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="glass-btn-primary w-full"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
