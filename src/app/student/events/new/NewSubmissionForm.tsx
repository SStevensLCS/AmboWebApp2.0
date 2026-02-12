"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, History } from "lucide-react";

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
      <Card className="max-w-md mx-auto animate-in zoom-in-95 duration-200">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-xl">Submitted!</h3>
            <p className="text-muted-foreground text-sm">
              Your service hours have been logged successfully.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={() => {
                setSuccess(false);
                setForm({ event_title: "", hours: "", tour_credits: "", notes: "" });
              }}
            >
              Log Another
            </Button>
            <Button variant="outline" onClick={() => router.push("/student")}>
              View Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Log Service Hours</CardTitle>
        <CardDescription>
          Enter the details of your completed service event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={form.event_title}
              onChange={(e) => update("event_title", e.target.value)}
              placeholder="e.g. Family Tour, Campus Preview Day"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours Served</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0"
                value={form.hours}
                onChange={(e) => update("hours", e.target.value)}
                placeholder="2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Tour Credits</Label>
              <Input
                id="credits"
                type="number"
                step="1"
                min="0"
                value={form.tour_credits}
                onChange={(e) => update("tour_credits", e.target.value)}
                placeholder="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Feedback</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="How did the event go? Any issues?"
              className="resize-none min-h-[100px]"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Log"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t p-4 bg-muted/50 rounded-b-xl">
        <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => router.push("/student")}>
          <History className="mr-2 h-3 w-3" />
          View Submission History
        </Button>
      </CardFooter>
    </Card>
  );
}
