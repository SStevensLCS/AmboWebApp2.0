"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/history", label: "History" },
  { href: "/student/new", label: "New" },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy text-white safe-bottom z-10">
      <div className="flex justify-around items-center h-14 max-w-2xl mx-auto">
        {nav.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center py-3 text-sm font-medium ${
              pathname === href ? "text-sky-blue" : "text-white/80"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
