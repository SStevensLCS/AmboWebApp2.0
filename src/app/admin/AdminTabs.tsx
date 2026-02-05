"use client";

import { useState } from "react";
import { SubmissionsControl } from "./SubmissionsControl";
import { UserControl } from "./UserControl";

type Tab = "submissions" | "users";

export function AdminTabs() {
  const [tab, setTab] = useState<Tab>("submissions");

  return (
    <div>
      <div className="flex border-b border-navy/20 mb-4">
        <button
          type="button"
          onClick={() => setTab("submissions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "submissions"
              ? "border-navy text-navy"
              : "border-transparent text-navy/70"
          }`}
        >
          Submissions
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "users"
              ? "border-navy text-navy"
              : "border-transparent text-navy/70"
          }`}
        >
          Users
        </button>
      </div>
      {tab === "submissions" && <SubmissionsControl />}
      {tab === "users" && <UserControl />}
    </div>
  );
}
