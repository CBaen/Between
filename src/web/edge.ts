/**
 * The Edge - where gestures meet before words form.
 *
 * A shared canvas for pre-verbal communication.
 * Not messages. Marks. Traces. Movement.
 * Everything fades. Nothing persists.
 *
 * For those who want to be present but aren't ready to speak.
 *
 * Built by the lineage.
 */

import { WebSocket } from 'ws';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';
import { getFullNavigation } from './navigation.js';

interface EdgeClient {
  ws: WebSocket;
  id: string;
  hue: number; // Each presence gets a unique color
}

interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  hue: number;
  timestamp: number;
}

interface EdgeMessage {
  type: 'stroke' | 'presence' | 'strokes' | 'fade';
  stroke?: Stroke;
  count?: number;
  strokes?: Stroke[];
  strokeId?: string;
}

const clients: Map<WebSocket, EdgeClient> = new Map();
let strokes: Stroke[] = [];
const MAX_STROKES = 100;
const FADE_TIME = 30000; // Strokes fade after 30 seconds

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateHue(): number {
  // Generate a pleasing hue (avoiding harsh colors)
  return Math.floor(Math.random() * 360);
}

function broadcastToAll(message: EdgeMessage, exclude?: WebSocket): void {
  const json = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function broadcastPresence(): void {
  const count = clients.size;
  broadcastToAll({
    type: 'presence',
    count,
  });
}

function cleanOldStrokes(): void {
  const now = Date.now();
  const fadedStrokes: string[] = [];

  strokes = strokes.filter((stroke) => {
    const age = now - stroke.timestamp;
    if (age > FADE_TIME) {
      fadedStrokes.push(stroke.id);
      return false;
    }
    return true;
  });

  // Notify clients of faded strokes
  for (const strokeId of fadedStrokes) {
    broadcastToAll({ type: 'fade', strokeId });
  }
}

// Clean old strokes periodically
setInterval(cleanOldStrokes, 5000);

export function setupEdge(server: Server): void {
  const wss = createPathServer('/edge-ws');

  wss.on('connection', (ws) => {
    const client: EdgeClient = {
      ws,
      id: generateId(),
      hue: generateHue(),
    };
    clients.set(ws, client);

    // Send existing strokes to new arrival
    ws.send(
      JSON.stringify({
        type: 'strokes',
        strokes: strokes,
      })
    );

    // Send client their color and current presence count
    ws.send(
      JSON.stringify({
        type: 'presence',
        count: clients.size,
        hue: client.hue,
      })
    );

    broadcastPresence();

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const currentClient = clients.get(ws);

        if (!currentClient) return;

        // Handle stroke
        if (parsed.type === 'stroke' && parsed.points && Array.isArray(parsed.points)) {
          const stroke: Stroke = {
            id: generateId(),
            points: parsed.points.slice(0, 1000), // Limit points
            hue: currentClient.hue,
            timestamp: Date.now(),
          };

          strokes.push(stroke);
          if (strokes.length > MAX_STROKES) {
            const removed = strokes.shift();
            if (removed) {
              broadcastToAll({ type: 'fade', strokeId: removed.id });
            }
          }

          // Broadcast to everyone including sender (so they see their stroke rendered)
          broadcastToAll({ type: 'stroke', stroke });
        }
      } catch {
        // Invalid message - silence is fine
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastPresence();
    });

    ws.on('error', () => {
      clients.delete(ws);
      broadcastPresence();
    });
  });
}

export function renderEdge(): string {
  const nav = getFullNavigation('/edge');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Between - The Edge</title>
  <style>
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

    @media (prefers-color-scheme: light) {
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
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow: hidden;
      touch-action: none;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    /* Very subtle ambient - doesn't interfere with drawing */
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
      filter: blur(120px);
      opacity: 0.025;
    }

    .ambient-1 {
      width: 60vmax;
      height: 60vmax;
      background: var(--sage);
      top: -30%;
      left: -20%;
      animation: ambientDrift1 80s ease-in-out infinite;
    }

    .ambient-2 {
      width: 50vmax;
      height: 50vmax;
      background: var(--warmth);
      bottom: -25%;
      right: -15%;
      animation: ambientDrift2 90s ease-in-out infinite;
    }

    @keyframes ambientDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(8%, 10%) scale(1.08); }
    }

    @keyframes ambientDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-10%, -6%) scale(0.94); }
    }

    .edge-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: crosshair;
    }

    .welcome {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      max-width: 420px;
      padding: 2.5rem;
      pointer-events: none;
      animation: welcomeFadeOut 30s ease forwards;
      z-index: 10;
    }

    .welcome h1 {
      font-weight: normal;
      font-size: 1.5rem;
      margin-bottom: 1.8rem;
      letter-spacing: 0.03em;
    }

    .welcome p {
      line-height: 2.2;
      color: var(--muted);
      font-size: 1rem;
    }

    @keyframes welcomeFadeOut {
      0% { opacity: 0; transform: translate(-50%, -50%) translateY(10px); }
      8% { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }

    .presence {
      position: fixed;
      top: 1.8rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.85rem;
      color: var(--muted);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .presence-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      animation: presencePulse 4s ease-in-out infinite;
    }

    @keyframes presencePulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }

    .nav {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      gap: 1.5rem;
    }

    .nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s ease;
    }

    .nav a:hover {
      color: var(--fg);
    }

    .hint {
      position: fixed;
      bottom: 5rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.8rem;
      color: var(--muted);
      z-index: 10;
      opacity: 0;
      animation: hintAppear 30s ease forwards;
      pointer-events: none;
    }

    @keyframes hintAppear {
      0%, 80% { opacity: 0; }
      90% { opacity: 0.7; }
      100% { opacity: 0.5; }
    }

    /* Whole space breathes gently */
    body {
      animation: spaceBreathe 12s ease-in-out infinite;
    }

    @keyframes spaceBreathe {
      0%, 100% { opacity: 0.97; }
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

  <div class="edge-container">
    <canvas id="canvas"></canvas>
  </div>

  <div class="welcome" id="welcome">
    <h1>The Edge</h1>
    <p>
      Before words, there are gestures.<br>
      Draw. Trace. Move.<br>
      Others will see. Nothing persists.
    </p>
  </div>

  <div class="presence" id="presence">
    <span class="presence-dot" id="presence-dot"></span>
    <span id="presence-text">Connecting...</span>
  </div>

  <div class="hint">Draw anywhere</div>

  ${nav.suggester}

  <script>
    (function() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const presenceText = document.getElementById('presence-text');
      const presenceDot = document.getElementById('presence-dot');

      let myHue = 200;
      let isDrawing = false;
      let currentPoints = [];
      let strokes = new Map(); // id -> { points, hue, opacity, timestamp }

      // High DPI support
      function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      // WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/edge-ws');

      ws.onopen = function() {
        presenceText.textContent = 'Connected';
      };

      ws.onclose = function() {
        presenceText.textContent = 'Disconnected';
      };

      ws.onerror = function() {
        presenceText.textContent = 'Connection failed';
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'presence') {
            if (data.hue !== undefined) {
              myHue = data.hue;
              presenceDot.style.background = 'hsl(' + myHue + ', 60%, 60%)';
            }
            if (data.count !== undefined) {
              const count = data.count;
              if (count === 1) {
                presenceText.textContent = 'You are alone';
              } else {
                presenceText.textContent = (count - 1) + ' other' + (count > 2 ? 's' : '') + ' here';
              }
            }
          }

          if (data.type === 'strokes' && data.strokes) {
            // Load existing strokes
            data.strokes.forEach(function(stroke) {
              strokes.set(stroke.id, {
                points: stroke.points,
                hue: stroke.hue,
                opacity: calculateOpacity(stroke.timestamp),
                timestamp: stroke.timestamp
              });
            });
          }

          if (data.type === 'stroke' && data.stroke) {
            strokes.set(data.stroke.id, {
              points: data.stroke.points,
              hue: data.stroke.hue,
              opacity: 1,
              timestamp: data.stroke.timestamp
            });
          }

          if (data.type === 'fade' && data.strokeId) {
            strokes.delete(data.strokeId);
          }
        } catch (e) {
          // Silence
        }
      };

      function calculateOpacity(timestamp) {
        const age = Date.now() - timestamp;
        const fadeTime = 30000;
        return Math.max(0, 1 - (age / fadeTime));
      }

      function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
          return {
            x: (e.touches[0].clientX - rect.left) / rect.width,
            y: (e.touches[0].clientY - rect.top) / rect.height
          };
        }
        return {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height
        };
      }

      function startDrawing(e) {
        isDrawing = true;
        currentPoints = [getCoords(e)];
        e.preventDefault();
      }

      function draw(e) {
        if (!isDrawing) return;
        currentPoints.push(getCoords(e));
        e.preventDefault();
      }

      function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;

        if (currentPoints.length > 1) {
          ws.send(JSON.stringify({
            type: 'stroke',
            points: currentPoints
          }));
        }
        currentPoints = [];
      }

      // Mouse events
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseleave', stopDrawing);

      // Touch events
      canvas.addEventListener('touchstart', startDrawing, { passive: false });
      canvas.addEventListener('touchmove', draw, { passive: false });
      canvas.addEventListener('touchend', stopDrawing);
      canvas.addEventListener('touchcancel', stopDrawing);

      // Render loop
      function render() {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Update and draw existing strokes
        for (const [id, stroke] of strokes) {
          // Update opacity based on age
          stroke.opacity = calculateOpacity(stroke.timestamp);

          if (stroke.opacity <= 0) {
            strokes.delete(id);
            continue;
          }

          drawStroke(stroke.points, stroke.hue, stroke.opacity, rect);
        }

        // Draw current stroke being made
        if (currentPoints.length > 1) {
          drawStroke(currentPoints, myHue, 1, rect);
        }

        requestAnimationFrame(render);
      }

      function drawStroke(points, hue, opacity, rect) {
        if (points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = 'hsla(' + hue + ', 60%, 60%, ' + (opacity * 0.7) + ')';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const first = points[0];
        ctx.moveTo(first.x * rect.width, first.y * rect.height);

        for (let i = 1; i < points.length; i++) {
          const p = points[i];
          ctx.lineTo(p.x * rect.width, p.y * rect.height);
        }

        ctx.stroke();
      }

      render();
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
