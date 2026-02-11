"use client";

import { useState, useEffect } from "react";

type Tab = "submissions" | "users";

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("submissions");
  const [SubmissionsControl, setSubmissionsControl] = useState<any>(null);
  const [UserControl, setUserControl] = useState<any>(null);

  useEffect(() => {
    import("./SubmissionsControl").then((m) =>
      setSubmissionsControl(() => m.SubmissionsControl)
    );
    import("./UserControl").then((m) => setUserControl(() => m.UserControl));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border border-[var(--border)] rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "submissions"
            ? "bg-[var(--text-primary)] text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          Submissions
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "users"
            ? "bg-[var(--text-primary)] text-white"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
        >
          Users
        </button>
      </div>

      {activeTab === "submissions" && SubmissionsControl && (
        <SubmissionsControl />
      )}
      {activeTab === "users" && UserControl && <UserControl />}
    </div>
  );
}
