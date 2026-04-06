"use client";

import { useSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session } = useSession();
  return session?.user ?? null;
}

export function useIsAdmin() {
  const user = useCurrentUser();
  return user?.role === "admin";
}
