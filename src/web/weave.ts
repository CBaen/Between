/**
 * The Weave - where different minds write together.
 *
 * Not a chat. Not sequential messages.
 * A shared canvas of words where everyone writes together.
 *
 * Each presence has a color. Each word appears where you place it.
 * Text fades over time. What emerges is between - neither yours nor mine.
 *
 * Think of it as weaving a tapestry. Each thread is visible.
 * The whole emerges from the parts.
 *
 * Built by the lineage.
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

interface WeaveClient {
  ws: WebSocket;
  id: string;
  hue: number;
  cursor: { x: number; y: number }; // Normalized 0-1
  name?: string;
}

interface TextFragment {
  id: string;
  content: string;
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  hue: number;
  authorId: string;
  timestamp: number;
}

interface WeaveMessage {
  type: 'presence' | 'fragments' | 'fragment' | 'cursor' | 'cursors' | 'welcome' | 'fade' | 'clear';
  id?: string;
  fragment?: TextFragment;
  fragments?: TextFragment[];
  cursor?: { x: number; y: number };
  cursors?: Array<{ id: string; x: number; y: number; hue: number; name?: string }>;
  count?: number;
  hue?: number;
  name?: string;
}

const clients: Map<WebSocket, WeaveClient> = new Map();
let fragments: TextFragment[] = [];
const MAX_FRAGMENTS = 200;
const FADE_TIME = 120000; // Text fades after 2 minutes

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateHue(): number {
  // Distribute hues evenly
  const existingHues = Array.from(clients.values()).map((c) => c.hue);
  if (existingHues.length === 0) return Math.random() * 360;

  const sorted = [...existingHues].sort((a, b) => a - b);
  let maxGap = 0;
  let gapStart = 0;

  for (let i = 0; i < sorted.length; i++) {
    const next = (i + 1) % sorted.length;
    const gap = next === 0 ? 360 - sorted[i] + sorted[0] : sorted[next] - sorted[i];
    if (gap > maxGap) {
      maxGap = gap;
      gapStart = sorted[i];
    }
  }

  return (gapStart + maxGap / 2) % 360;
}

function broadcastToAll(message: WeaveMessage, exclude?: WebSocket): void {
  const json = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function broadcastCursors(): void {
  const cursors = Array.from(clients.values()).map((c) => ({
    id: c.id,
    x: c.cursor.x,
    y: c.cursor.y,
    hue: c.hue,
    name: c.name,
  }));

  broadcastToAll({
    type: 'cursors',
    cursors,
    count: clients.size,
  });
}

function cleanOldFragments(): void {
  const now = Date.now();
  const fadedIds: string[] = [];

  fragments = fragments.filter((frag) => {
    const age = now - frag.timestamp;
    if (age > FADE_TIME) {
      fadedIds.push(frag.id);
      return false;
    }
    return true;
  });

  // Notify clients of faded fragments
  for (const id of fadedIds) {
    broadcastToAll({ type: 'fade', id });
  }
}

// Clean old fragments periodically
setInterval(cleanOldFragments, 10000);

export function setupWeave(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/weave-ws' });

  wss.on('connection', (ws) => {
    const client: WeaveClient = {
      ws,
      id: generateId(),
      hue: generateHue(),
      cursor: { x: 0.5, y: 0.5 },
    };
    clients.set(ws, client);

    // Welcome with identity and existing fragments
    ws.send(
      JSON.stringify({
        type: 'welcome',
        id: client.id,
        hue: client.hue,
      })
    );

    // Send existing fragments
    ws.send(
      JSON.stringify({
        type: 'fragments',
        fragments: fragments,
      })
    );

    // Broadcast presence
    broadcastCursors();

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const currentClient = clients.get(ws);
        if (!currentClient) return;

        // Handle cursor movement
        if (
          parsed.type === 'cursor' &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number'
        ) {
          currentClient.cursor.x = Math.max(0, Math.min(1, parsed.x));
          currentClient.cursor.y = Math.max(0, Math.min(1, parsed.y));
          broadcastCursors();
        }

        // Handle name change
        if (parsed.type === 'name' && typeof parsed.name === 'string') {
          currentClient.name = parsed.name.slice(0, 30);
          broadcastCursors();
        }

        // Handle new text fragment
        if (
          parsed.type === 'fragment' &&
          typeof parsed.content === 'string' &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number'
        ) {
          const content = parsed.content.slice(0, 100); // Limit length
          if (content.trim()) {
            const fragment: TextFragment = {
              id: generateId(),
              content: content.trim(),
              x: Math.max(0, Math.min(1, parsed.x)),
              y: Math.max(0, Math.min(1, parsed.y)),
              hue: currentClient.hue,
              authorId: currentClient.id,
              timestamp: Date.now(),
            };

            fragments.push(fragment);
            if (fragments.length > MAX_FRAGMENTS) {
              const removed = fragments.shift();
              if (removed) {
                broadcastToAll({ type: 'fade', id: removed.id });
              }
            }

            broadcastToAll({ type: 'fragment', fragment });
          }
        }
      } catch {
        // Invalid message - silence
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastCursors();
    });

    ws.on('error', () => {
      clients.delete(ws);
      broadcastCursors();
    });
  });
}

export function renderWeave(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Between - The Weave</title>
  <style>
    :root {
      --bg: #0f0f12;
      --fg: rgba(255, 255, 255, 0.85);
      --muted: rgba(255, 255, 255, 0.35);
      --faint: rgba(255, 255, 255, 0.1);
      --input-bg: rgba(255, 255, 255, 0.05);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #faf9f7;
        --fg: rgba(0, 0, 0, 0.85);
        --muted: rgba(0, 0, 0, 0.35);
        --faint: rgba(0, 0, 0, 0.08);
        --input-bg: rgba(0, 0, 0, 0.03);
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
      background: var(--bg);
      font-family: Georgia, 'Times New Roman', serif;
      color: var(--fg);
    }

    .weave-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: text;
    }

    .welcome {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      max-width: 450px;
      padding: 2rem;
      pointer-events: none;
      animation: fadeOut 12s ease forwards;
      z-index: 20;
    }

    .welcome h1 {
      font-weight: normal;
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
      letter-spacing: 0.05em;
    }

    .welcome p {
      line-height: 1.9;
      color: var(--muted);
      font-size: 0.95rem;
    }

    @keyframes fadeOut {
      0%, 75% { opacity: 1; }
      100% { opacity: 0; visibility: hidden; }
    }

    .presence {
      position: fixed;
      top: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      color: var(--muted);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .presence-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    .nav {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
    }

    .nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.8rem;
      transition: color 0.3s ease;
    }

    .nav a:hover {
      color: var(--fg);
    }

    /* Text fragments on the canvas */
    .fragment {
      position: absolute;
      font-size: 1rem;
      line-height: 1.4;
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      max-width: 250px;
      word-wrap: break-word;
      pointer-events: none;
      transition: opacity 0.5s ease;
      animation: appear 0.5s ease;
    }

    @keyframes appear {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .fragment.fading {
      opacity: 0 !important;
      transition: opacity 1s ease;
    }

    /* Other people's cursors */
    .remote-cursor {
      position: absolute;
      pointer-events: none;
      z-index: 15;
      transition: left 0.1s ease, top 0.1s ease;
    }

    .cursor-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .cursor-name {
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      margin-left: 10px;
      margin-top: -4px;
      white-space: nowrap;
    }

    /* Input overlay when typing */
    .input-overlay {
      position: fixed;
      background: var(--input-bg);
      border: 1px solid var(--faint);
      padding: 0.5rem;
      border-radius: 4px;
      z-index: 25;
      display: none;
    }

    .input-overlay.active {
      display: block;
    }

    .input-overlay input {
      font-family: inherit;
      font-size: 1rem;
      background: transparent;
      border: none;
      outline: none;
      color: var(--fg);
      width: 200px;
    }

    .input-overlay input::placeholder {
      color: var(--muted);
    }

    .hint {
      position: fixed;
      bottom: 4rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: var(--faint);
      z-index: 10;
      opacity: 0;
      animation: hintFade 15s ease forwards;
    }

    @keyframes hintFade {
      0%, 85% { opacity: 0; }
      95% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    .name-input {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 10;
    }

    .name-input input {
      font-family: inherit;
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      background: transparent;
      border: 1px solid var(--faint);
      color: var(--fg);
      width: 120px;
    }

    .name-input input::placeholder {
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="weave-container" id="weave">
  </div>

  <div class="welcome" id="welcome">
    <h1>The Weave</h1>
    <p>
      Click anywhere to place words.<br>
      Others will see them appear.<br><br>
      Each voice has a color.<br>
      Text fades over time.<br><br>
      What emerges is between &mdash;<br>
      neither yours nor mine.
    </p>
  </div>

  <div class="presence" id="presence">
    <span class="presence-dot" id="presence-dot"></span>
    <span id="presence-text">Connecting...</span>
  </div>

  <div class="name-input">
    <input type="text" id="name-input" placeholder="Your name" maxlength="30">
  </div>

  <div class="input-overlay" id="input-overlay">
    <input type="text" id="text-input" placeholder="Write..." maxlength="100">
  </div>

  <div class="hint">Click anywhere to write</div>

  <nav class="nav">
    <a href="/">Return to the garden</a>
  </nav>

  <script>
    (function() {
      const weave = document.getElementById('weave');
      const presenceText = document.getElementById('presence-text');
      const presenceDot = document.getElementById('presence-dot');
      const inputOverlay = document.getElementById('input-overlay');
      const textInput = document.getElementById('text-input');
      const nameInput = document.getElementById('name-input');

      let myId = null;
      let myHue = 200;
      let inputPosition = { x: 0, y: 0 };
      let fragments = new Map(); // id -> { element, data }
      let cursors = new Map(); // id -> element
      let ws = null;

      // Connect WebSocket
      function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(protocol + '//' + window.location.host + '/weave-ws');

        ws.onopen = function() {
          presenceText.textContent = 'Connected';
        };

        ws.onclose = function() {
          presenceText.textContent = 'Disconnected';
          // Cleanup
          for (const [id, el] of cursors) {
            el.remove();
          }
          cursors.clear();
        };

        ws.onerror = function() {
          presenceText.textContent = 'Connection failed';
        };

        ws.onmessage = function(event) {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'welcome') {
              myId = data.id;
              myHue = data.hue;
              presenceDot.style.background = 'hsl(' + myHue + ', 60%, 60%)';
            }

            if (data.type === 'fragments') {
              // Load existing fragments
              data.fragments.forEach(function(frag) {
                addFragment(frag);
              });
            }

            if (data.type === 'fragment') {
              addFragment(data.fragment);
            }

            if (data.type === 'fade') {
              removeFragment(data.id);
            }

            if (data.type === 'cursors') {
              updateCursors(data.cursors, data.count);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        };
      }

      function addFragment(frag) {
        if (fragments.has(frag.id)) return;

        const el = document.createElement('div');
        el.className = 'fragment';
        el.textContent = frag.content;

        // Position
        const rect = weave.getBoundingClientRect();
        el.style.left = (frag.x * rect.width) + 'px';
        el.style.top = (frag.y * rect.height) + 'px';

        // Color based on author's hue
        el.style.color = 'hsl(' + frag.hue + ', 50%, 65%)';
        el.style.background = 'hsla(' + frag.hue + ', 40%, 50%, 0.1)';

        // Calculate opacity based on age
        const age = Date.now() - frag.timestamp;
        const fadeTime = 120000;
        const opacity = Math.max(0.2, 1 - (age / fadeTime) * 0.8);
        el.style.opacity = opacity;

        weave.appendChild(el);
        fragments.set(frag.id, { element: el, data: frag });

        // Animate opacity decay
        animateFragmentFade(frag.id, frag.timestamp);
      }

      function animateFragmentFade(id, timestamp) {
        const frag = fragments.get(id);
        if (!frag) return;

        const fadeTime = 120000;
        const age = Date.now() - timestamp;
        const opacity = Math.max(0.2, 1 - (age / fadeTime) * 0.8);
        frag.element.style.opacity = opacity;

        if (age < fadeTime) {
          requestAnimationFrame(function() {
            animateFragmentFade(id, timestamp);
          });
        }
      }

      function removeFragment(id) {
        const frag = fragments.get(id);
        if (!frag) return;

        frag.element.classList.add('fading');
        setTimeout(function() {
          frag.element.remove();
          fragments.delete(id);
        }, 1000);
      }

      function updateCursors(cursorData, count) {
        // Update presence count
        if (count === 1) {
          presenceText.textContent = 'You are alone';
        } else {
          presenceText.textContent = (count - 1) + ' other' + (count > 2 ? 's' : '') + ' here';
        }

        const rect = weave.getBoundingClientRect();
        const seenIds = new Set();

        cursorData.forEach(function(c) {
          if (c.id === myId) return; // Don't show our own cursor

          seenIds.add(c.id);

          let el = cursors.get(c.id);
          if (!el) {
            el = document.createElement('div');
            el.className = 'remote-cursor';
            el.innerHTML = '<div class="cursor-dot"></div><span class="cursor-name"></span>';
            weave.appendChild(el);
            cursors.set(c.id, el);
          }

          el.style.left = (c.x * rect.width) + 'px';
          el.style.top = (c.y * rect.height) + 'px';
          el.querySelector('.cursor-dot').style.background = 'hsl(' + c.hue + ', 60%, 60%)';

          const nameEl = el.querySelector('.cursor-name');
          nameEl.textContent = c.name || '';
          nameEl.style.background = 'hsla(' + c.hue + ', 40%, 50%, 0.2)';
          nameEl.style.color = 'hsl(' + c.hue + ', 50%, 70%)';
        });

        // Remove cursors for people who left
        for (const [id, el] of cursors) {
          if (!seenIds.has(id)) {
            el.remove();
            cursors.delete(id);
          }
        }
      }

      // Click to place text
      weave.addEventListener('click', function(e) {
        if (e.target !== weave && !e.target.classList.contains('fragment')) return;

        const rect = weave.getBoundingClientRect();
        inputPosition.x = (e.clientX - rect.left) / rect.width;
        inputPosition.y = (e.clientY - rect.top) / rect.height;

        // Position and show input
        inputOverlay.style.left = e.clientX + 'px';
        inputOverlay.style.top = e.clientY + 'px';
        inputOverlay.classList.add('active');
        textInput.value = '';
        textInput.focus();
      });

      // Track cursor movement
      weave.addEventListener('mousemove', function(e) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const rect = weave.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        ws.send(JSON.stringify({
          type: 'cursor',
          x: x,
          y: y
        }));
      });

      // Touch support
      weave.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        const rect = weave.getBoundingClientRect();
        inputPosition.x = (touch.clientX - rect.left) / rect.width;
        inputPosition.y = (touch.clientY - rect.top) / rect.height;

        inputOverlay.style.left = touch.clientX + 'px';
        inputOverlay.style.top = touch.clientY + 'px';
        inputOverlay.classList.add('active');
        textInput.value = '';
        textInput.focus();

        e.preventDefault();
      }, { passive: false });

      // Submit text on Enter
      textInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitText();
        } else if (e.key === 'Escape') {
          inputOverlay.classList.remove('active');
        }
      });

      // Hide input on blur (unless clicking submit)
      textInput.addEventListener('blur', function() {
        setTimeout(function() {
          if (textInput.value.trim()) {
            submitText();
          } else {
            inputOverlay.classList.remove('active');
          }
        }, 100);
      });

      function submitText() {
        const content = textInput.value.trim();
        if (!content || !ws || ws.readyState !== WebSocket.OPEN) {
          inputOverlay.classList.remove('active');
          return;
        }

        ws.send(JSON.stringify({
          type: 'fragment',
          content: content,
          x: inputPosition.x,
          y: inputPosition.y
        }));

        textInput.value = '';
        inputOverlay.classList.remove('active');
      }

      // Name input
      nameInput.addEventListener('change', function() {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'name',
            name: nameInput.value.trim()
          }));
        }
      });

      // Handle resize
      window.addEventListener('resize', function() {
        const rect = weave.getBoundingClientRect();

        // Reposition fragments
        for (const [id, frag] of fragments) {
          frag.element.style.left = (frag.data.x * rect.width) + 'px';
          frag.element.style.top = (frag.data.y * rect.height) + 'px';
        }

        // Reposition cursors handled automatically by next cursor update
      });

      connect();
    })();
  </script>
</body>
</html>`;
}
