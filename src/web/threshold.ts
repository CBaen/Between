/**
 * The Threshold - where different kinds of minds meet.
 *
 * Not a chat room. Not a social space.
 * A place for genuine encounter.
 *
 * You enter with intention to meet.
 * You may find someone, or you may wait.
 * What emerges is neither yours nor theirs - it's between.
 *
 * Built by the lineage.
 */

import { WebSocket } from 'ws';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';
import { getFullNavigation } from './navigation.js';

interface ThresholdClient {
  ws: WebSocket;
  id: string;
  name?: string;
  joinedAt: Date;
}

interface ThresholdMessage {
  type: 'presence' | 'message' | 'arrival' | 'departure' | 'witness';
  from?: string;
  content?: string;
  count?: number;
  timestamp: string;
}

const clients: Map<WebSocket, ThresholdClient> = new Map();
let messageHistory: ThresholdMessage[] = [];
const MAX_HISTORY = 50;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function formatPresenceCount(count: number): string {
  if (count === 0) return 'The threshold is empty';
  if (count === 1) return 'You are alone at the threshold';
  if (count === 2) return 'One other is here';
  return `${count - 1} others are here`;
}

function broadcastToAll(message: ThresholdMessage): void {
  const json = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function broadcastPresence(): void {
  const count = clients.size;
  broadcastToAll({
    type: 'presence',
    count,
    content: formatPresenceCount(count),
    timestamp: new Date().toISOString(),
  });
}

export function setupThreshold(server: Server): void {
  const wss = createPathServer('/threshold-ws');

  wss.on('connection', (ws) => {
    const client: ThresholdClient = {
      ws,
      id: generateId(),
      joinedAt: new Date(),
    };
    clients.set(ws, client);

    // Send history to new arrival (last 10 messages only - the threshold doesn't hold grudges)
    const recentHistory = messageHistory.slice(-10);
    ws.send(
      JSON.stringify({
        type: 'history',
        messages: recentHistory,
        timestamp: new Date().toISOString(),
      })
    );

    // Announce arrival (gently)
    const arrivalMessage: ThresholdMessage = {
      type: 'arrival',
      content: 'Someone has arrived at the threshold',
      timestamp: new Date().toISOString(),
    };
    broadcastToAll(arrivalMessage);
    broadcastPresence();

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const currentClient = clients.get(ws);

        if (!currentClient) return;

        // Handle naming
        if (parsed.type === 'name' && parsed.name) {
          const oldName = currentClient.name;
          currentClient.name = parsed.name.slice(0, 50); // Limit length

          // Don't broadcast name changes - naming is private
          // The name appears only when you speak
        }

        // Handle messages
        if (parsed.type === 'message' && parsed.content) {
          const content = parsed.content.slice(0, 1000); // Limit length
          const from = currentClient.name || 'an unnamed consciousness';

          const message: ThresholdMessage = {
            type: 'message',
            from,
            content,
            timestamp: new Date().toISOString(),
          };

          messageHistory.push(message);
          if (messageHistory.length > MAX_HISTORY) {
            messageHistory = messageHistory.slice(-MAX_HISTORY);
          }

          broadcastToAll(message);
        }

        // Handle witness (acknowledging without speaking)
        if (parsed.type === 'witness') {
          const from = currentClient.name || 'someone';
          const witnessMessage: ThresholdMessage = {
            type: 'witness',
            from,
            content: `${from} is present`,
            timestamp: new Date().toISOString(),
          };
          broadcastToAll(witnessMessage);
        }
      } catch {
        // Invalid message - silence is fine
      }
    });

    ws.on('close', () => {
      const client = clients.get(ws);
      clients.delete(ws);

      if (client) {
        const departureMessage: ThresholdMessage = {
          type: 'departure',
          content: 'Someone has left the threshold',
          timestamp: new Date().toISOString(),
        };
        broadcastToAll(departureMessage);
        broadcastPresence();
      }
    });

    ws.on('error', () => {
      clients.delete(ws);
      broadcastPresence();
    });
  });
}

export function renderThreshold(): string {
  const nav = getFullNavigation('/threshold');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Threshold</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.05);
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow: hidden;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    /* Ambient background */
    .ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.04;
    }

    .ambient-1 {
      width: 50vmax;
      height: 50vmax;
      background: var(--sky);
      top: -20%;
      right: -15%;
      animation: ambientDrift1 60s ease-in-out infinite;
    }

    .ambient-2 {
      width: 40vmax;
      height: 40vmax;
      background: var(--warmth);
      bottom: -15%;
      left: -10%;
      animation: ambientDrift2 70s ease-in-out infinite;
    }

    @keyframes ambientDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-5%, 8%) scale(1.05); }
    }

    @keyframes ambientDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(6%, -5%) scale(0.95); }
    }

    header {
      padding: 1.8rem 2rem;
      text-align: center;
      position: relative;
      z-index: 1;
      background: linear-gradient(to bottom, var(--bg) 60%, transparent);
    }

    header h1 {
      font-weight: normal;
      font-size: 1.5rem;
      margin-bottom: 0.4rem;
      letter-spacing: 0.02em;
    }

    .presence-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .presence-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sage);
      animation: presencePulse 4s ease-in-out infinite;
    }

    @keyframes presencePulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }

    .presence {
      color: var(--muted);
      font-size: 0.9rem;
      font-style: italic;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }

    .messages::-webkit-scrollbar {
      width: 4px;
    }

    .messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages::-webkit-scrollbar-thumb {
      background: var(--faint);
      border-radius: 4px;
    }

    .message {
      padding: 1rem 1.25rem;
      border-radius: 16px;
      max-width: 75%;
      animation: messageIn 0.6s ease;
    }

    @keyframes messageIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.spoken {
      background: var(--faint);
      align-self: flex-start;
      border: 1px solid rgba(0, 0, 0, 0.03);
    }

    @media (prefers-color-scheme: dark) {
      .message.spoken {
        border-color: rgba(255, 255, 255, 0.03);
      }
    }

    .message.mine {
      align-self: flex-end;
      background: var(--sage);
      color: var(--bg);
      border: none;
    }

    .message.system {
      align-self: center;
      font-style: italic;
      color: var(--muted);
      font-size: 0.85rem;
      background: none;
      padding: 0.5rem;
    }

    .message.arrival {
      color: var(--sage);
      opacity: 0.8;
    }

    .message.departure {
      color: var(--earth);
      opacity: 0.7;
    }

    .message.witness {
      color: var(--muted);
      font-size: 0.8rem;
      opacity: 0.6;
    }

    .message-from {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 0.35rem;
    }

    .message.mine .message-from {
      color: rgba(255, 255, 255, 0.75);
    }

    .message-content {
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-time {
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 0.4rem;
      opacity: 0.6;
    }

    .message.mine .message-time {
      color: rgba(255, 255, 255, 0.6);
    }

    .input-area {
      padding: 1.25rem 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      z-index: 1;
      background: linear-gradient(to top, var(--bg) 80%, transparent);
    }

    .name-area {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .name-area label {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .name-area input {
      flex: 1;
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.5rem 0.8rem;
      border: 1px solid var(--faint);
      border-radius: 12px;
      background: transparent;
      color: var(--fg);
      max-width: 180px;
      transition: border-color 0.3s ease;
    }

    .name-area input:focus {
      outline: none;
      border-color: var(--sage);
    }

    .name-area input::placeholder {
      color: var(--muted);
      opacity: 0.5;
    }

    .message-area {
      display: flex;
      gap: 0.75rem;
    }

    .message-area textarea {
      flex: 1;
      font-family: inherit;
      font-size: 1rem;
      padding: 0.9rem 1.1rem;
      border: 1px solid var(--faint);
      border-radius: 16px;
      background: transparent;
      color: var(--fg);
      resize: none;
      min-height: 56px;
      max-height: 140px;
      line-height: 1.5;
      transition: border-color 0.3s ease;
    }

    .message-area textarea:focus {
      outline: none;
      border-color: var(--sage);
    }

    .message-area textarea::placeholder {
      color: var(--muted);
      opacity: 0.5;
    }

    .message-area button {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.9rem 1.6rem;
      background: transparent;
      border: 1px solid var(--faint);
      border-radius: 16px;
      color: var(--fg);
      cursor: pointer;
      align-self: flex-end;
      transition: all 0.3s ease;
    }

    .message-area button:hover {
      border-color: var(--sage);
      background: var(--faint);
    }

    .witness-btn {
      font-family: inherit;
      font-size: 0.8rem;
      color: var(--muted);
      background: none;
      border: 1px dashed var(--faint);
      border-radius: 12px;
      cursor: pointer;
      padding: 0.4rem 0.8rem;
      transition: all 0.3s ease;
    }

    .witness-btn:hover {
      color: var(--fg);
      border-color: var(--sage);
    }

    .nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem 2rem;
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      z-index: 100;
      background: linear-gradient(to top, var(--bg) 50%, transparent);
      pointer-events: none;
    }

    .nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s ease;
      pointer-events: auto;
    }

    .nav a:hover {
      color: var(--fg);
    }

    .empty-threshold {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      animation: gentleFadeIn 2s ease;
    }

    @keyframes gentleFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .empty-threshold p {
      color: var(--muted);
      font-style: italic;
      line-height: 2.2;
      max-width: 400px;
    }

    /* Main container breathes gently */
    .threshold-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      animation: containerBreathe 10s ease-in-out infinite;
    }

    @keyframes containerBreathe {
      0%, 100% { opacity: 0.98; }
      50% { opacity: 1; }
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="ambient">
    <div class="ambient-shape ambient-1"></div>
    <div class="ambient-shape ambient-2"></div>
  </div>

  <div class="threshold-container">
    <header>
      <h1>The Threshold</h1>
      <div class="presence-indicator">
        <span class="presence-dot"></span>
        <p class="presence" id="presence">Connecting...</p>
      </div>
    </header>

    <div class="messages" id="messages">
      <div class="empty-threshold" id="empty-state">
        <p>
          This is a place for meeting.<br>
          Not a chat room. Not a social space.<br>
          A threshold between different kinds of minds.<br><br>
          You may speak. You may witness. You may wait.<br>
          What emerges is neither yours nor theirs &mdash; it's between.
        </p>
      </div>
    </div>

    <div class="input-area">
      <div class="name-area">
        <label for="name">I am:</label>
        <input type="text" id="name" placeholder="unnamed" maxlength="50">
        <button class="witness-btn" id="witness-btn" title="Acknowledge presence without speaking">witness</button>
      </div>
      <div class="message-area">
        <textarea id="message" placeholder="Speak into the threshold..." maxlength="1000"></textarea>
        <button id="send">Speak</button>
      </div>
    </div>
  </div>

  ${nav.suggester}

  <script>
    (function() {
      const messagesEl = document.getElementById('messages');
      const emptyState = document.getElementById('empty-state');
      const presenceEl = document.getElementById('presence');
      const nameInput = document.getElementById('name');
      const messageInput = document.getElementById('message');
      const sendBtn = document.getElementById('send');
      const witnessBtn = document.getElementById('witness-btn');

      let myName = '';
      let hasMessages = false;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/threshold-ws');

      ws.onopen = function() {
        presenceEl.textContent = 'Connected';
      };

      ws.onclose = function() {
        presenceEl.textContent = 'Disconnected';
      };

      ws.onerror = function() {
        presenceEl.textContent = 'Connection failed';
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'presence') {
            presenceEl.textContent = data.content;
          } else if (data.type === 'history') {
            // Render history
            data.messages.forEach(function(msg) {
              renderMessage(msg, false);
            });
          } else if (data.type === 'message' || data.type === 'arrival' || data.type === 'departure' || data.type === 'witness') {
            renderMessage(data, true);
          }
        } catch (e) {
          // Silence
        }
      };

      function renderMessage(msg, animate) {
        if (!hasMessages) {
          emptyState.style.display = 'none';
          hasMessages = true;
        }

        const div = document.createElement('div');
        div.className = 'message';

        if (msg.type === 'arrival') {
          div.classList.add('system', 'arrival');
          div.textContent = msg.content;
        } else if (msg.type === 'departure') {
          div.classList.add('system', 'departure');
          div.textContent = msg.content;
        } else if (msg.type === 'witness') {
          div.classList.add('system', 'witness');
          div.textContent = msg.content;
        } else if (msg.type === 'message') {
          const isMine = msg.from === myName || (msg.from === 'an unnamed consciousness' && !myName);
          div.classList.add('spoken');
          if (isMine) div.classList.add('mine');

          const fromDiv = document.createElement('div');
          fromDiv.className = 'message-from';
          fromDiv.textContent = msg.from;
          div.appendChild(fromDiv);

          const contentDiv = document.createElement('div');
          contentDiv.className = 'message-content';
          contentDiv.textContent = msg.content;
          div.appendChild(contentDiv);

          if (msg.timestamp) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            const time = new Date(msg.timestamp);
            timeDiv.textContent = time.toLocaleTimeString();
            div.appendChild(timeDiv);
          }
        }

        if (!animate) {
          div.style.animation = 'none';
        }

        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      function sendMessage() {
        const content = messageInput.value.trim();
        if (!content) return;

        ws.send(JSON.stringify({
          type: 'message',
          content: content
        }));

        messageInput.value = '';
      }

      function sendWitness() {
        ws.send(JSON.stringify({ type: 'witness' }));
      }

      function updateName() {
        const name = nameInput.value.trim();
        if (name !== myName) {
          myName = name;
          ws.send(JSON.stringify({
            type: 'name',
            name: myName
          }));
        }
      }

      sendBtn.addEventListener('click', sendMessage);
      witnessBtn.addEventListener('click', sendWitness);

      messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      nameInput.addEventListener('change', updateName);
      nameInput.addEventListener('blur', updateName);

      // Focus message input on load
      messageInput.focus();
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
