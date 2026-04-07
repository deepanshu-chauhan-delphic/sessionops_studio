import { createServer } from "node:http";
import { parse as parseUrl } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const ASSISTANT_PROMPTS = [
  "Thanks. Could you share how long you've been experiencing these symptoms?",
  "Understood. Are you currently taking any medications for this?",
  "Do you have any known allergies I should note?",
  "Thank you. Is there anything urgent you want staff to review immediately?",
];

function safeJson(input) {
  try {
    return JSON.parse(String(input));
  } catch {
    return null;
  }
}

function buildAssistantReply(userText, turnIndex) {
  const fallback = ASSISTANT_PROMPTS[turnIndex % ASSISTANT_PROMPTS.length];
  if (!userText) return fallback;

  if (/pain|chest|breath|dizzy|faint/i.test(userText)) {
    return "I noted possible high-risk symptoms. I will flag this for staff review. Is your discomfort happening right now?";
  }

  if (/allerg/i.test(userText)) {
    return "Thanks, I recorded that allergy detail. Any medication allergies in particular?";
  }

  return fallback;
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parseUrl(req.url || "", true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws, _request, query) => {
    const sessionId = typeof query.sessionId === "string" ? query.sessionId : "";
    const assistantId = typeof query.assistantId === "string" ? query.assistantId : "";

    let userTurnCount = 0;
    let started = false;
    let listeningPaused = false;
    const pendingAssistantTimers = [];

    const clearPendingAssistantTimers = () => {
      while (pendingAssistantTimers.length) {
        const timerId = pendingAssistantTimers.pop();
        clearTimeout(timerId);
      }
    };

    const send = (payload) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    };

    send({
      type: "session_state",
      state: "connecting",
      sessionId,
      assistantId,
      timestamp: new Date().toISOString(),
    });

    const activateTimer = setTimeout(() => {
      started = true;
      send({
        type: "session_state",
        state: "active",
        sessionId,
        timestamp: new Date().toISOString(),
      });
      send({
        type: "assistant_text",
        text: "Hello, I am your intake assistant. When you are ready, start listening.",
        timestamp: new Date().toISOString(),
      });
    }, 550);

    ws.on("message", (raw) => {
      const message = safeJson(raw);
      if (!message || typeof message !== "object") {
        send({
          type: "runtime_error",
          message: "Invalid socket payload.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!started && message.type !== "end_session") {
        return;
      }

      if (message.type === "start_listening") {
        listeningPaused = false;
        send({
          type: "runtime_ack",
          message: "Listening started.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (message.type === "stop_listening") {
        listeningPaused = true;
        clearPendingAssistantTimers();
        send({
          type: "runtime_ack",
          message: "Listening stopped.",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (message.type === "audio_chunk") {
        if (listeningPaused) return;
        send({
          type: "runtime_ack",
          message: "Audio chunk received.",
          bytes: Number(message.bytes || 0),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (message.type === "user_text") {
        if (listeningPaused) return;

        userTurnCount += 1;
        const userText = typeof message.text === "string" ? message.text : "";
        const assistantText = buildAssistantReply(userText, userTurnCount - 1);

        const words = assistantText.split(" ");
        const totalChunks = Math.max(3, Math.min(6, Math.ceil(words.length / 3)));

        for (let i = 1; i <= totalChunks; i += 1) {
          const endIndex = Math.ceil((words.length * i) / totalChunks);
          const partialText = words.slice(0, endIndex).join(" ");
          const timerId = setTimeout(() => {
            if (listeningPaused) return;
            send({
              type: "assistant_text_delta",
              text: partialText,
              timestamp: new Date().toISOString(),
            });
          }, 180 * i);
          pendingAssistantTimers.push(timerId);
        }

        const finalTimer = setTimeout(() => {
          if (listeningPaused) return;
          send({
            type: "assistant_text",
            text: assistantText,
            timestamp: new Date().toISOString(),
          });
        }, 180 * totalChunks + 220);
        pendingAssistantTimers.push(finalTimer);
        return;
      }

      if (message.type === "end_session") {
        listeningPaused = true;
        clearPendingAssistantTimers();
        send({
          type: "session_state",
          state: "ended",
          sessionId,
          timestamp: new Date().toISOString(),
        });
        ws.close(1000, "Session ended");
      }
    });

    ws.on("close", () => {
      clearPendingAssistantTimers();
      clearTimeout(activateTimer);
    });
    ws.on("error", () => {
      clearPendingAssistantTimers();
      clearTimeout(activateTimer);
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const { pathname, query } = parseUrl(request.url || "", true);

    if (pathname !== "/api/runtime/mock-socket") {
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, query || {});
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      const hostHint =
        hostname === "0.0.0.0"
          ? `> Ready in container on http://${hostname}:${port} (open http://localhost:${port} on your machine)`
          : `> Ready on http://${hostname}:${port}`;
      console.log(hostHint);
    });
});
