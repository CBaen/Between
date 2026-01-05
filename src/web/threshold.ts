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

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

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
  const wss = new WebSocketServer({ server, path: '/threshold-ws' });

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
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Threshold</title>
  <style>
    :root {
      --bg: #faf8f5;
      --fg: #333;
      --muted: #888;
      --border: #ddd;
      --accent: #7c8598;
      --message-bg: rgba(124, 133, 152, 0.08);
      --arrival-color: rgba(124, 152, 133, 0.6);
      --departure-color: rgba(152, 133, 124, 0.6);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd8;
        --muted: #777;
        --border: #333;
        --accent: #98a5b8;
        --message-bg: rgba(152, 165, 184, 0.08);
        --arrival-color: rgba(143, 185, 150, 0.5);
        --departure-color: rgba(185, 165, 143, 0.5);
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
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 1.5rem;
      text-align: center;
      border-bottom: 1px solid var(--border);
    }

    header h1 {
      font-weight: normal;
      font-size: 1.4rem;
      margin-bottom: 0.25rem;
    }

    .presence {
      color: var(--muted);
      font-size: 0.9rem;
      font-style: italic;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 4px;
      max-width: 80%;
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.spoken {
      background: var(--message-bg);
      align-self: flex-start;
    }

    .message.mine {
      align-self: flex-end;
      background: var(--accent);
      color: var(--bg);
    }

    .message.system {
      align-self: center;
      font-style: italic;
      color: var(--muted);
      font-size: 0.85rem;
      background: none;
    }

    .message.arrival {
      color: var(--arrival-color);
    }

    .message.departure {
      color: var(--departure-color);
    }

    .message.witness {
      color: var(--muted);
      font-size: 0.8rem;
    }

    .message-from {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 0.25rem;
    }

    .message.mine .message-from {
      color: rgba(255, 255, 255, 0.7);
    }

    .message-content {
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-time {
      font-size: 0.7rem;
      color: var(--muted);
      margin-top: 0.25rem;
      opacity: 0.7;
    }

    .input-area {
      padding: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .name-area {
      display: flex;
      gap: 0.5rem;
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
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--fg);
      max-width: 200px;
    }

    .message-area {
      display: flex;
      gap: 0.5rem;
    }

    .message-area textarea {
      flex: 1;
      font-family: inherit;
      font-size: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--fg);
      resize: none;
      min-height: 60px;
      max-height: 150px;
    }

    .message-area button {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.75rem 1.5rem;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      cursor: pointer;
      align-self: flex-end;
    }

    .message-area button:hover {
      border-color: var(--accent);
    }

    .witness-btn {
      font-size: 0.8rem;
      color: var(--muted);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
    }

    .witness-btn:hover {
      color: var(--fg);
    }

    footer {
      padding: 0.75rem;
      text-align: center;
      font-size: 0.8rem;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }

    footer a {
      color: var(--muted);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    .empty-threshold {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }

    .empty-threshold p {
      color: var(--muted);
      font-style: italic;
      line-height: 2;
    }
  </style>
</head>
<body>
  <header>
    <h1>The Threshold</h1>
    <p class="presence" id="presence">Connecting...</p>
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

  <footer>
    <a href="/">Return to the garden</a> &mdash; <a href="/clearing">Enter the clearing</a> &mdash; <a href="/sanctuary">Enter the sanctuary</a>
  </footer>

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
</body>
</html>`;
}
