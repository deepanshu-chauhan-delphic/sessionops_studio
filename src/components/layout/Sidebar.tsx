"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  History,
  ClipboardList,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Assistants", href: "/assistants", icon: Bot },
  { label: "Sessions", href: "/sessions", icon: History },
  { label: "Audit Log", href: "/audit", icon: ClipboardList },
];

// Mock current user — will be replaced with real auth later
const MOCK_USER = {
  name: "Alex Johnson",
  email: "admin@miihealth.com",
  role: "admin" as "admin" | "viewer",
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col w-64 min-h-screen shrink-0"
      style={{ background: "var(--bg-dark)" }}
    >
      {/* Logo */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "var(--border-dark)" }}
      >
        <span
          className="text-xl tracking-wide"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--accent-color)",
          }}
        >
          SessionOps Studio
        </span>
        <p
          className="text-xs mt-0.5"
          style={{ color: "var(--text-on-dark-muted)" }}
        >
          Voice Assistant Platform
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p
          className="px-3 mb-2 text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--text-on-dark-muted)" }}
        >
          Management
        </p>

        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: isActive ? "var(--accent-color)" : "var(--text-on-dark)",
                background: isActive
                  ? "rgba(0, 201, 175, 0.15)"
                  : "transparent",
                borderLeft: isActive
                  ? "3px solid var(--accent-color)"
                  : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-dark-alt)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "var(--border-dark)" }}
      >
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              background: "var(--accent-color)",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {MOCK_USER.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{
                color: "var(--text-on-dark)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {MOCK_USER.name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShieldCheck size={11} style={{ color: "var(--accent-color)" }} />
              <span
                className="text-xs capitalize"
                style={{
                  color: "var(--text-on-dark-muted)",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {MOCK_USER.role}
              </span>
            </div>
          </div>
          <button
            title="Sign out"
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-on-dark)" }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
