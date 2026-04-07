"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar, { MobileNavToggle } from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (pathname === "/login") {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((prev) => !prev)}
      />

      <div
        className={`flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <header
          className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:hidden"
          style={{
            background: "#ffffff",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <MobileNavToggle onOpen={() => setMobileOpen(true)} />
            <p
              className="text-base"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              SessionOps Studio
            </p>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
