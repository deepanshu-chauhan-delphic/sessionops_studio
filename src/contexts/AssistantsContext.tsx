"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Assistant, AuditLog } from "@/lib/types";

interface CreateData {
  name: string;
  purpose: string;
  voice: string;
  language: string;
  tools: unknown[];
}

interface UpdateData {
  name: string;
  purpose: string;
  voice: string;
  language: string;
  tools: unknown[];
}

interface AssistantsContextValue {
  assistants: Assistant[];
  auditLogs: AuditLog[];
  loading: boolean;
  createAssistant: (data: CreateData, publish: boolean) => Promise<Assistant>;
  updateAssistant: (id: string, data: UpdateData) => Promise<void>;
  publishAssistant: (id: string) => Promise<void>;
  duplicateAssistant: (id: string) => Promise<Assistant>;
  archiveAssistant: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const AssistantsContext = createContext<AssistantsContextValue | null>(null);

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function AssistantsProvider({ children }: { children: ReactNode }) {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssistants = useCallback(async () => {
    try {
      const data = await apiFetch<Assistant[]>("/api/assistants");
      setAssistants(data);
    } catch {
      // silently fail — user will see empty list
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const data = await apiFetch<AuditLog[]>("/api/audit");
      setAuditLogs(data);
    } catch {
      // silently fail
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([fetchAssistants(), fetchAuditLogs()]);
  }, [fetchAssistants, fetchAuditLogs]);

  useEffect(() => {
    setLoading(true);
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  async function createAssistant(data: CreateData, publish: boolean): Promise<Assistant> {
    const assistant = await apiFetch<Assistant>("/api/assistants", {
      method: "POST",
      body: JSON.stringify({ ...data, publish }),
    });
    await refetch();
    return assistant;
  }

  async function updateAssistant(id: string, data: UpdateData): Promise<void> {
    await apiFetch(`/api/assistants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    await refetch();
  }

  async function publishAssistant(id: string): Promise<void> {
    await apiFetch(`/api/assistants/${id}/publish`, { method: "PATCH" });
    await refetch();
  }

  async function duplicateAssistant(id: string): Promise<Assistant> {
    const copy = await apiFetch<Assistant>(`/api/assistants/${id}/duplicate`, { method: "POST" });
    await refetch();
    return copy;
  }

  async function archiveAssistant(id: string): Promise<void> {
    await apiFetch(`/api/assistants/${id}/archive`, { method: "PATCH" });
    await refetch();
  }

  return (
    <AssistantsContext.Provider value={{
      assistants, auditLogs, loading,
      createAssistant, updateAssistant, publishAssistant, duplicateAssistant, archiveAssistant, refetch,
    }}>
      {children}
    </AssistantsContext.Provider>
  );
}

export function useAssistants() {
  const ctx = useContext(AssistantsContext);
  if (!ctx) throw new Error("useAssistants must be used within AssistantsProvider");
  return ctx;
}
