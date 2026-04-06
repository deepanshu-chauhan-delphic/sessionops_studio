"use client";

import { SessionProvider } from "next-auth/react";
import { AssistantsProvider } from "@/contexts/AssistantsContext";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AssistantsProvider>{children}</AssistantsProvider>
    </SessionProvider>
  );
}
