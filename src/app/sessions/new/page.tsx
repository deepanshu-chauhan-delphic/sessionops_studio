"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Mic, PlayCircle, StopCircle, Loader2 } from "lucide-react";
import type { Assistant } from "@/lib/types";

type RuntimeState = "idle" | "connecting" | "active" | "ended" | "error";
type ListeningState = "off" | "starting" | "listening" | "processing";

interface TranscriptLine {
  id: string;
  speaker: "user" | "assistant";
  content: string;
  timestamp: string;
  sequence: number;
}

const USER_UTTERANCE_SAMPLES = [
  "I have had a headache for three days and mild nausea.",
  "I am taking ibuprofen occasionally, around twice a day.",
  "I do not have food allergies, but I am allergic to penicillin.",
  "My symptoms get worse in the evening after work.",
  "No chest pain, but I do feel fatigued throughout the day.",
];

const STATE_LABELS: Record<RuntimeState, string> = {
  idle: "Idle",
  connecting: "Connecting",
  active: "Active",
  ended: "Ended",
  error: "Error",
};

const LISTENING_LABELS: Record<ListeningState, string> = {
  off: "Listening Off",
  starting: "Starting Microphone",
  listening: "Listening",
  processing: "Processing Turn",
};

const STATE_STYLES: Record<RuntimeState, { bg: string; text: string; border: string }> = {
  idle: { bg: "rgba(53,57,63,0.12)", text: "#35393f", border: "rgba(53,57,63,0.2)" },
  connecting: { bg: "rgba(243,156,18,0.15)", text: "#f39c12", border: "rgba(243,156,18,0.3)" },
  active: { bg: "rgba(0,201,175,0.15)", text: "#00c9af", border: "rgba(0,201,175,0.3)" },
  ended: { bg: "rgba(0,201,175,0.1)", text: "#00c9af", border: "rgba(0,201,175,0.25)" },
  error: { bg: "rgba(231,76,60,0.15)", text: "#e74c3c", border: "rgba(231,76,60,0.3)" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function wsUrl(sessionId: string, assistantId: string) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${protocol}://${host}/api/runtime/mock-socket?sessionId=${encodeURIComponent(sessionId)}&assistantId=${encodeURIComponent(assistantId)}`;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function NewSessionContent() {
  const searchParams = useSearchParams();
  const assistantId = searchParams.get("assistantId") || "";

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loadingAssistant, setLoadingAssistant] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("idle");
  const [listeningState, setListeningState] = useState<ListeningState>("off");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [pendingAssistantText, setPendingAssistantText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [userTurnCursor, setUserTurnCursor] = useState(0);
  const [micGranted, setMicGranted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const runtimeStateRef = useRef<RuntimeState>("idle");
  const listeningEnabledRef = useRef(false);
  const ignoreAssistantMessagesRef = useRef(false);
  const listeningLoopRunningRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, pendingAssistantText]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    runtimeStateRef.current = runtimeState;
    if (runtimeState !== "active") {
      listeningEnabledRef.current = false;
      setListeningState("off");
    }
  }, [runtimeState]);

  useEffect(() => {
    let cancelled = false;

    async function loadAssistant() {
      if (!assistantId) {
        setErrorMessage("Missing assistantId in URL.");
        setLoadingAssistant(false);
        return;
      }

      setLoadingAssistant(true);
      try {
        const res = await fetch(`/api/assistants/${assistantId}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
        if (!cancelled) {
          setAssistant(body as Assistant);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load assistant.");
        }
      } finally {
        if (!cancelled) setLoadingAssistant(false);
      }
    }

    loadAssistant();
    return () => {
      cancelled = true;
    };
  }, [assistantId]);

  useEffect(() => {
    return () => {
      listeningEnabledRef.current = false;
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
        wsRef.current.close();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function persistTranscriptLine(
    speaker: "user" | "assistant",
    content: string,
    timestamp: string,
  ) {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) return;

    const res = await fetch(`/api/sessions/${currentSessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "append_transcript",
        speaker,
        content,
        timestamp,
      }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || `Transcript save failed: ${res.status}`);
    }

    // If stop-listening was clicked while this assistant line was being persisted,
    // do not append it to the live transcript UI.
    if (speaker === "assistant" && ignoreAssistantMessagesRef.current) {
      return;
    }

    setTranscript((prev) => [
      ...prev,
      {
        id: body.id,
        speaker: body.speaker,
        content: body.content,
        timestamp: body.timestamp,
        sequence: body.sequence,
      },
    ]);
  }

  async function createSessionRecord() {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assistantId,
        metadata: {
          micGranted: true,
          browser: navigator.userAgent,
          runtimeMode: "mock-websocket-continuous",
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Session start failed: ${res.status}`);
    return body as { id: string };
  }

  async function ensureMicAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicGranted(true);
      return true;
    } catch {
      setRuntimeState("error");
      setErrorMessage(
        "Microphone permission denied. Please allow microphone access and try again.",
      );
      return false;
    }
  }

  function stopListening() {
    listeningEnabledRef.current = false;
    ignoreAssistantMessagesRef.current = true;
    setListeningState("off");
    setPendingAssistantText("");

    const recorder = activeRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop_listening" }));
    }
  }

  async function endSession(status: "completed" | "failed" = "completed", failureReason = "") {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || isEnding) return;

    setIsEnding(true);
    stopListening();

    try {
      wsRef.current?.send(JSON.stringify({ type: "end_session" }));
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());

      const res = await fetch(`/api/sessions/${currentSessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          status,
          failureReason,
          metadata: {
            micGranted,
            runtimeStateAtEnd: runtimeStateRef.current,
          },
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Session end failed: ${res.status}`);
      }

      setPendingAssistantText("");
      setRuntimeState(status === "failed" ? "error" : "ended");
    } catch (err) {
      setRuntimeState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to end session.");
    } finally {
      setIsEnding(false);
    }
  }

  async function startSession() {
    if (!assistant) return;
    if (assistant.status !== "published") {
      setErrorMessage("Only published assistants can be launched.");
      return;
    }

    setErrorMessage(null);
    setRuntimeState("connecting");
    setTranscript([]);
    setPendingAssistantText("");
    setListeningState("off");
    listeningEnabledRef.current = false;
    ignoreAssistantMessagesRef.current = false;

    const micOk = await ensureMicAccess();
    if (!micOk) return;

    try {
      const created = await createSessionRecord();
      setSessionId(created.id);

      const socket = new WebSocket(wsUrl(created.id, assistant.id));
      wsRef.current = socket;

      socket.onmessage = async (event) => {
        const message = JSON.parse(event.data as string) as
          | { type: "session_state"; state: RuntimeState }
          | { type: "assistant_text"; text: string; timestamp: string }
          | { type: "assistant_text_delta"; text: string }
          | { type: "runtime_error"; message: string };

        if (message.type === "session_state") {
          setRuntimeState(message.state);
          if (message.state !== "active") {
            stopListening();
          }
          return;
        }

        if (message.type === "assistant_text_delta") {
          if (ignoreAssistantMessagesRef.current) return;
          setPendingAssistantText(message.text || "");
          return;
        }

        if (message.type === "assistant_text") {
          if (ignoreAssistantMessagesRef.current) return;
          setPendingAssistantText("");
          await persistTranscriptLine(
            "assistant",
            message.text,
            message.timestamp || new Date().toISOString(),
          );
          return;
        }

        if (message.type === "runtime_error") {
          setRuntimeState("error");
          setErrorMessage(message.message || "Mock runtime reported an error.");
          await endSession("failed", "Runtime error reported by mock socket.");
        }
      };

      socket.onerror = async () => {
        setRuntimeState("error");
        setErrorMessage("Runtime unavailable. Please retry the session.");
        await endSession("failed", "Runtime unavailable.");
      };

      socket.onclose = () => {
        stopListening();
        if (runtimeStateRef.current === "active" || runtimeStateRef.current === "connecting") {
          setRuntimeState("ended");
        }
      };
    } catch (err) {
      setRuntimeState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to start session.");
    }
  }

  async function captureAndSendTurn(): Promise<boolean> {
    const socket = wsRef.current;
    const stream = streamRef.current;
    if (!stream || !socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error("Runtime socket is not connected.");
    }

    if (!listeningEnabledRef.current) return false;

    setListeningState("listening");

    const recorder = new MediaRecorder(stream);
    activeRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    const bytes = await new Promise<number>((resolve) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      recorder.onstop = () => {
        const total = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
        resolve(total);
      };

      recorder.start(250);
      window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 1800);
    });

    activeRecorderRef.current = null;

    if (!listeningEnabledRef.current) {
      return false;
    }

    const userText = USER_UTTERANCE_SAMPLES[userTurnCursor % USER_UTTERANCE_SAMPLES.length];
    const timestamp = new Date().toISOString();
    setUserTurnCursor((value) => value + 1);

    setListeningState("processing");
    socket.send(JSON.stringify({ type: "audio_chunk", bytes }));
    await persistTranscriptLine("user", userText, timestamp);
    socket.send(JSON.stringify({ type: "user_text", text: userText, bytes }));
    await delay(1000);

    if (!listeningEnabledRef.current) {
      return false;
    }

    return true;
  }

  async function runListeningLoop() {
    if (listeningLoopRunningRef.current) return;
    if (runtimeStateRef.current !== "active") return;

    listeningEnabledRef.current = true;
    listeningLoopRunningRef.current = true;
    setListeningState("starting");
    await delay(300);

    try {
      while (listeningEnabledRef.current && runtimeStateRef.current === "active") {
        const sent = await captureAndSendTurn();
        if (!sent || !listeningEnabledRef.current || runtimeStateRef.current !== "active") break;
        setListeningState("listening");
        await delay(600);
      }
    } catch (err) {
      setRuntimeState("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed while listening.");
      await endSession("failed", "Listening loop failed.");
    } finally {
      listeningLoopRunningRef.current = false;
      if (!listeningEnabledRef.current) {
        setListeningState("off");
      }
    }
  }

  const statusStyle = useMemo(() => STATE_STYLES[runtimeState], [runtimeState]);
  const listeningActive =
    listeningState === "starting" || listeningState === "listening" || listeningState === "processing";

  return (
    <div className="p-8">
      <Link
        href="/assistants"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          fontFamily: "'Inter', sans-serif",
          color: "var(--text-secondary)",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        <ChevronLeft size={14} /> Back to Assistants
      </Link>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 18,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            color: "var(--text-primary)",
            margin: "0 0 8px",
          }}
        >
          Live Voice Session
        </h1>
        <p
          style={{
            margin: "0 0 12px",
            fontFamily: "'Inter', sans-serif",
            color: "var(--text-secondary)",
            fontSize: 14,
          }}
        >
          {loadingAssistant
            ? "Loading assistant..."
            : assistant
              ? `Assistant: ${assistant.name}`
              : "Assistant unavailable"}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              background: statusStyle.bg,
              color: statusStyle.text,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {STATE_LABELS[runtimeState]}
          </span>

          {runtimeState === "active" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 12px",
                borderRadius: 999,
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                background: "rgba(0,201,175,0.1)",
                color: "#00c9af",
                border: "1px solid rgba(0,201,175,0.3)",
              }}
            >
              {LISTENING_LABELS[listeningState]}
            </span>
          )}

          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12,
              color: "var(--text-secondary)",
            }}
          >
            Simulation Mode - Continuous Mock Runtime
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--error)",
            background: "rgba(231,76,60,0.08)",
            color: "var(--error)",
            fontSize: 13,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {errorMessage}
        </div>
      )}

      <div
        style={{
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: 12,
          minHeight: 340,
          maxHeight: 460,
          overflowY: "auto",
          padding: 16,
          marginBottom: 16,
        }}
      >
        {transcript.length === 0 && !pendingAssistantText ? (
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
            }}
          >
            No transcript yet. Start session and begin listening to simulate continuous voice flow.
          </p>
        ) : (
          <>
            {transcript.map((line) => (
              <div
                key={line.id}
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background:
                    line.speaker === "assistant" ? "rgba(0,201,175,0.08)" : "rgba(53,57,63,0.08)",
                  border:
                    line.speaker === "assistant"
                      ? "1px solid rgba(0,201,175,0.2)"
                      : "1px solid rgba(53,57,63,0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>
                    {line.speaker === "assistant" ? "Assistant" : "User"}
                  </strong>
                  <span style={{ color: "var(--text-secondary)" }}>{formatTime(line.timestamp)}</span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {line.content}
                </p>
              </div>
            ))}

            {pendingAssistantText && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(0,201,175,0.08)",
                  border: "1px solid rgba(0,201,175,0.2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>Assistant</strong>
                  <span style={{ color: "var(--text-secondary)" }}>Typing...</span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {pendingAssistantText}
                </p>
              </div>
            )}

            {runtimeState === "active" && listeningActive && !pendingAssistantText && (
              <div
                style={{
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(0,201,175,0.08)",
                  border: "1px solid rgba(0,201,175,0.2)",
                  width: "fit-content",
                  minWidth: 88,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 6,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>Assistant</strong>
                </div>
                <span className="listening-dots" aria-label="Assistant is listening">
                  <span className="listening-dot" />
                  <span className="listening-dot" />
                  <span className="listening-dot" />
                </span>
              </div>
            )}
          </>
        )}
        <div ref={transcriptEndRef} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {runtimeState !== "ended" && runtimeState !== "error" && (
          <button
            onClick={runtimeState === "idle" ? startSession : () => endSession("completed")}
            disabled={
              loadingAssistant ||
              !assistant ||
              assistant.status !== "published" ||
              runtimeState === "connecting" ||
              isEnding
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              minWidth: 158,
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: runtimeState === "active" ? "#e74c3c" : "#00c9af",
              color: "#ffffff",
              cursor:
                loadingAssistant ||
                !assistant ||
                assistant.status !== "published" ||
                runtimeState === "connecting" ||
                isEnding
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loadingAssistant ||
                !assistant ||
                assistant.status !== "published" ||
                runtimeState === "connecting" ||
                isEnding
                  ? 0.55
                  : 1,
              transition: "background 0.15s",
            }}
          >
            {runtimeState === "connecting" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : runtimeState === "active" ? (
              <StopCircle size={15} />
            ) : (
              <PlayCircle size={15} />
            )}
            <span>
              {runtimeState === "connecting"
                ? "Connecting..."
                : runtimeState === "active"
                  ? isEnding
                    ? "Ending..."
                    : "End Session"
                  : "Start Session"}
            </span>
          </button>
        )}

        {runtimeState === "active" && (
          <button
            onClick={() => {
              if (listeningEnabledRef.current) {
                stopListening();
              } else {
                setErrorMessage(null);
                ignoreAssistantMessagesRef.current = false;
                wsRef.current?.send(JSON.stringify({ type: "start_listening" }));
                runListeningLoop();
              }
            }}
            disabled={isEnding || runtimeState !== "active"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--accent-color)",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              background: listeningEnabledRef.current ? "rgba(0,201,175,0.1)" : "transparent",
              color: "var(--accent-color)",
              cursor: isEnding ? "not-allowed" : "pointer",
              opacity: isEnding ? 0.6 : 1,
            }}
          >
            <Mic size={14} />
            {listeningEnabledRef.current ? "Stop Listening" : "Start Listening"}
          </button>
        )}
      </div>

      {sessionId && (runtimeState === "ended" || runtimeState === "error") && (
        <div style={{ marginTop: 14 }}>
          <Link
            href={`/sessions/${sessionId}`}
            style={{
              color: "var(--accent-color)",
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Open saved session details
          </Link>
        </div>
      )}
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <p style={{ fontSize: 14, color: "var(--text-secondary)", fontFamily: "'Inter', sans-serif" }}>
            Loading session...
          </p>
        </div>
      }
    >
      <NewSessionContent />
    </Suspense>
  );
}
