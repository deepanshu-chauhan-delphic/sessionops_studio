"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import {
  Bot,
  History,
  ClipboardList,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const NAV_ITEMS = [
  { label: "Assistants", href: "/assistants", icon: Bot },
  { label: "Sessions", href: "/sessions", icon: History },
  { label: "Audit Log", href: "/audit", icon: ClipboardList },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const accountLabel = useMemo(
    () => user?.name ?? user?.email ?? "Account",
    [user?.email, user?.name],
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: "rgba(30, 34, 41, 0.55)", border: "none" }}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col transition-all duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20" : "w-64"}`}
        style={{ background: "var(--bg-dark)" }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-4"
          style={{ borderColor: "var(--border-dark)" }}
        >
          <div className="min-w-0">
            <p
              className={`tracking-wide ${collapsed ? "text-base" : "text-xl"}`}
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--accent-color)",
                whiteSpace: "nowrap",
              }}
            >
              {collapsed ? "SOS" : "SessionOps Studio"}
            </p>
            {!collapsed && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--text-on-dark-muted)" }}
              >
                Voice Assistant Platform
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="hidden rounded-md border p-1.5 md:inline-flex"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                borderColor: "var(--border-dark)",
                color: "var(--text-on-dark)",
                background: "transparent",
              }}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
            <button
              type="button"
              className="rounded-md border p-1.5 md:hidden"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              style={{
                borderColor: "var(--border-dark)",
                color: "var(--text-on-dark)",
                background: "transparent",
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {!collapsed && (
            <p
              className="mb-2 px-3 text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--text-on-dark-muted)" }}
            >
              Management
            </p>
          )}

          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onCloseMobile}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : "gap-3"
                }`}
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
              >
                <Icon size={16} strokeWidth={1.8} />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div
          className="border-t px-3 py-4"
          style={{ borderColor: "var(--border-dark)" }}
        >
          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                className={`flex w-full items-center rounded-lg border px-2 py-2 ${
                  collapsed ? "justify-center" : "gap-2"
                }`}
                style={{
                  borderColor: "var(--border-dark)",
                  background: "var(--bg-dark-alt)",
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: "var(--accent-color)",
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {initials(accountLabel)}
                </div>

                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        className="truncate text-sm font-medium"
                        style={{
                          color: "var(--text-on-dark)",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {accountLabel}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <ShieldCheck
                          size={11}
                          style={{ color: "var(--accent-color)" }}
                        />
                        <span
                          className="text-xs capitalize"
                          style={{
                            color: "var(--text-on-dark-muted)",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      size={14}
                      style={{ color: "var(--text-on-dark-muted)" }}
                    />
                  </>
                )}
              </button>

              {accountMenuOpen && (
                <div
                  className={`z-50 mt-2 rounded-lg border p-2 ${
                    collapsed
                      ? "absolute bottom-0 left-full ml-2 w-56"
                      : "relative w-full"
                  }`}
                  style={{
                    background: "var(--bg-dark-alt)",
                    borderColor: "var(--border-dark)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(231, 76, 60, 0.4)",
                      color: "#ffffff",
                      background: "var(--error)",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function MobileNavToggle({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border md:hidden"
      aria-label="Open menu"
      style={{
        borderColor: "var(--border)",
        background: "#fff",
        color: "var(--text-primary)",
      }}
    >
      <Menu size={16} />
    </button>
  );
}
