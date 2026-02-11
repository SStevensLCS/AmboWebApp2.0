"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function StudentNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-20">
      <div className="flex justify-around items-center h-14 max-w-2xl mx-auto px-2">
        <Link
          href="/student"
          className={`flex flex-col items-center gap-0.5 p-2 transition-opacity ${isActive("/student") ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] tracking-wide">Home</span>
        </Link>

        <Link
          href="/student/events"
          className={`flex flex-col items-center gap-0.5 p-2 transition-opacity ${isActive("/student/events") ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] tracking-wide">Events</span>
        </Link>

        <Link
          href="/student/new"
          className={`flex flex-col items-center gap-0.5 p-2 transition-opacity ${isActive("/student/new") ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
        >
          <div className="border border-[var(--border)] p-1.5 rounded-full -mt-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[10px] tracking-wide">New</span>
        </Link>

        <Link
          href="/student/history"
          className={`flex flex-col items-center gap-0.5 p-2 transition-opacity ${isActive("/student/history") ? "opacity-100" : "opacity-40 hover:opacity-70"
            }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] tracking-wide">History</span>
        </Link>
      </div>
    </nav>
  );
}
