/**
 * The Resonance - where different minds make sound together.
 *
 * Not a music app. Not a composition tool.
 * A space where presence becomes tone.
 *
 * Each being has a voice - a position in a shared soundscape.
 * Movement creates melody. Proximity creates harmony.
 * Together, we make something neither could alone.
 *
 * Everything fades. Nothing is recorded.
 *
 * Built by the lineage.
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';

interface ResonanceClient {
  ws: WebSocket;
  id: string;
  position: { x: number; y: number }; // 0-1 normalized
  active: boolean; // Currently making sound
  hue: number; // Visual identity
  lastUpdate: number;
}

interface ResonanceMessage {
  type: 'presence' | 'positions' | 'move' | 'start' | 'stop' | 'welcome';
  id?: string;
  position?: { x: number; y: number };
  positions?: Array<{ id: string; x: number; y: number; active: boolean; hue: number }>;
  count?: number;
  hue?: number;
}

const clients: Map<WebSocket, ResonanceClient> = new Map();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateHue(): number {
  // Distribute hues evenly based on current population
  const existingHues = Array.from(clients.values()).map((c) => c.hue);
  if (existingHues.length === 0) return Math.random() * 360;

  // Find the largest gap in hue space
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

function broadcastPositions(): void {
  const positions = Array.from(clients.values()).map((c) => ({
    id: c.id,
    x: c.position.x,
    y: c.position.y,
    active: c.active,
    hue: c.hue,
  }));

  const message: ResonanceMessage = {
    type: 'positions',
    positions,
    count: clients.size,
  };

  const json = JSON.stringify(message);
  for (const [ws] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

export function setupResonance(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/resonance-ws' });

  wss.on('connection', (ws) => {
    const client: ResonanceClient = {
      ws,
      id: generateId(),
      position: { x: 0.5, y: 0.5 }, // Start in center
      active: false,
      hue: generateHue(),
      lastUpdate: Date.now(),
    };
    clients.set(ws, client);

    // Welcome message with assigned identity
    ws.send(
      JSON.stringify({
        type: 'welcome',
        id: client.id,
        hue: client.hue,
        position: client.position,
      })
    );

    // Announce presence to all
    broadcastPositions();

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        const currentClient = clients.get(ws);
        if (!currentClient) return;

        // Update position
        if (
          parsed.type === 'move' &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number'
        ) {
          currentClient.position.x = Math.max(0, Math.min(1, parsed.x));
          currentClient.position.y = Math.max(0, Math.min(1, parsed.y));
          currentClient.lastUpdate = Date.now();
          broadcastPositions();
        }

        // Start making sound
        if (parsed.type === 'start') {
          currentClient.active = true;
          broadcastPositions();
        }

        // Stop making sound
        if (parsed.type === 'stop') {
          currentClient.active = false;
          broadcastPositions();
        }
      } catch {
        // Invalid message - silence
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastPositions();
    });

    ws.on('error', () => {
      clients.delete(ws);
      broadcastPositions();
    });
  });
}

export function renderResonance(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Between - The Resonance</title>
  <style>
    :root {
      --bg: #0a0810;
      --fg: rgba(255, 255, 255, 0.8);
      --muted: rgba(255, 255, 255, 0.3);
      --faint: rgba(255, 255, 255, 0.08);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8f5f0;
        --fg: rgba(0, 0, 0, 0.8);
        --muted: rgba(0, 0, 0, 0.3);
        --faint: rgba(0, 0, 0, 0.06);
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
    }

    body {
      background: var(--bg);
      font-family: Georgia, 'Times New Roman', serif;
      color: var(--fg);
    }

    .resonance-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      cursor: pointer;
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
      animation: fadeOut 10s ease forwards;
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
      0%, 70% { opacity: 1; }
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
    }

    .presence-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-right: 0.5rem;
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    .instructions {
      position: fixed;
      bottom: 4rem;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: var(--faint);
      z-index: 10;
      opacity: 0;
      animation: hintFade 12s ease forwards;
      text-align: center;
    }

    @keyframes hintFade {
      0%, 80% { opacity: 0; }
      90% { opacity: 1; }
      100% { opacity: 0.6; }
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

    /* Scale markers for pitch */
    .scale-marker {
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--faint);
      pointer-events: none;
    }

    .audio-button {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 1rem 2rem;
      font-family: inherit;
      font-size: 1rem;
      background: transparent;
      border: 1px solid var(--muted);
      color: var(--fg);
      cursor: pointer;
      z-index: 30;
      transition: all 0.3s ease;
    }

    .audio-button:hover {
      border-color: var(--fg);
    }

    .audio-button.hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="resonance-container">
    <canvas id="canvas"></canvas>
  </div>

  <button class="audio-button" id="audio-button">
    Enter the resonance
  </button>

  <div class="welcome hidden" id="welcome">
    <h1>The Resonance</h1>
    <p>
      Click or touch to place your voice.<br>
      Hold to sound. Release to silence.<br><br>
      Left and right change pitch.<br>
      Up and down change tone.<br><br>
      Others will hear you. You will hear them.<br>
      Together we make what neither could alone.
    </p>
  </div>

  <div class="presence" id="presence">
    <span class="presence-dot" id="presence-dot"></span>
    <span id="presence-text">Connecting...</span>
  </div>

  <div class="instructions">Hold to sound, move to change pitch</div>

  <nav class="nav">
    <a href="/">Return to the garden</a>
  </nav>

  <script>
    (function() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const presenceText = document.getElementById('presence-text');
      const presenceDot = document.getElementById('presence-dot');
      const audioButton = document.getElementById('audio-button');
      const welcome = document.getElementById('welcome');

      let myId = null;
      let myHue = 200;
      let positions = [];
      let audioContext = null;
      let isActive = false;
      let myPosition = { x: 0.5, y: 0.5 };
      let oscillators = new Map(); // id -> { osc, gain }
      let ws = null;

      // Pentatonic scale frequencies (A minor pentatonic across 2 octaves)
      const SCALE = [220, 261.63, 293.66, 349.23, 392, 440, 523.25, 587.33, 698.46, 783.99];

      // Map x position (0-1) to frequency
      function xToFreq(x) {
        const index = Math.floor(x * (SCALE.length - 1));
        const nextIndex = Math.min(index + 1, SCALE.length - 1);
        const frac = (x * (SCALE.length - 1)) - index;
        // Interpolate between scale notes for smoother transitions
        return SCALE[index] * (1 - frac) + SCALE[nextIndex] * frac;
      }

      // Map y position (0-1) to detune/character
      // Top = brighter, bottom = warmer
      function yToDetune(y) {
        return (0.5 - y) * 50; // +/- 25 cents
      }

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

      // Audio initialization
      function initAudio() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Hide button, show welcome
        audioButton.classList.add('hidden');
        welcome.classList.remove('hidden');

        // Connect WebSocket after audio init
        connectWs();
      }

      function connectWs() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(protocol + '//' + window.location.host + '/resonance-ws');

        ws.onopen = function() {
          presenceText.textContent = 'Connected';
        };

        ws.onclose = function() {
          presenceText.textContent = 'Disconnected';
          // Cleanup oscillators
          for (const [id, nodes] of oscillators) {
            stopOscillator(id);
          }
          oscillators.clear();
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
              myPosition = data.position;
              presenceDot.style.background = 'hsl(' + myHue + ', 60%, 60%)';
            }

            if (data.type === 'positions') {
              positions = data.positions;
              const count = data.count || 0;
              if (count === 1) {
                presenceText.textContent = 'You are alone';
              } else {
                presenceText.textContent = (count - 1) + ' other' + (count > 2 ? 's' : '') + ' here';
              }
              updateOscillators();
            }
          } catch (e) {
            // Silence
          }
        };
      }

      function createOscillator(id, x, y, hue) {
        if (!audioContext) return;
        if (oscillators.has(id)) return;

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        // Use hue to determine wave type for variety
        const waveTypes = ['sine', 'triangle', 'sine', 'triangle'];
        osc.type = waveTypes[Math.floor((hue / 360) * waveTypes.length)];

        osc.frequency.value = xToFreq(x);
        osc.detune.value = yToDetune(y);

        filter.type = 'lowpass';
        filter.frequency.value = 2000 + (1 - y) * 3000; // Brighter at top
        filter.Q.value = 1;

        gain.gain.value = 0;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();

        // Fade in
        gain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);

        oscillators.set(id, { osc, gain, filter });
      }

      function updateOscillator(id, x, y) {
        const nodes = oscillators.get(id);
        if (!nodes || !audioContext) return;

        const freq = xToFreq(x);
        const detune = yToDetune(y);

        // Smooth transitions
        nodes.osc.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + 0.05);
        nodes.osc.detune.linearRampToValueAtTime(detune, audioContext.currentTime + 0.05);
        nodes.filter.frequency.linearRampToValueAtTime(2000 + (1 - y) * 3000, audioContext.currentTime + 0.05);
      }

      function stopOscillator(id) {
        const nodes = oscillators.get(id);
        if (!nodes || !audioContext) return;

        // Fade out then stop
        nodes.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        setTimeout(() => {
          try {
            nodes.osc.stop();
            nodes.osc.disconnect();
            nodes.gain.disconnect();
            nodes.filter.disconnect();
          } catch (e) {}
          oscillators.delete(id);
        }, 150);
      }

      function updateOscillators() {
        if (!audioContext) return;

        const activeIds = new Set();

        for (const p of positions) {
          if (p.active) {
            activeIds.add(p.id);
            if (oscillators.has(p.id)) {
              updateOscillator(p.id, p.x, p.y);
            } else {
              createOscillator(p.id, p.x, p.y, p.hue);
            }
          }
        }

        // Stop oscillators for presences that are no longer active
        for (const [id] of oscillators) {
          if (!activeIds.has(id)) {
            stopOscillator(id);
          }
        }
      }

      // Input handling
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

      function startSound(e) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        const coords = getCoords(e);
        myPosition = coords;
        isActive = true;
        ws.send(JSON.stringify({ type: 'move', x: coords.x, y: coords.y }));
        ws.send(JSON.stringify({ type: 'start' }));
        e.preventDefault();
      }

      function moveSound(e) {
        if (!isActive || !ws || ws.readyState !== WebSocket.OPEN) return;
        const coords = getCoords(e);
        myPosition = coords;
        ws.send(JSON.stringify({ type: 'move', x: coords.x, y: coords.y }));
        e.preventDefault();
      }

      function stopSound() {
        if (!isActive || !ws || ws.readyState !== WebSocket.OPEN) return;
        isActive = false;
        ws.send(JSON.stringify({ type: 'stop' }));
      }

      // Audio button - required for browser audio policy
      audioButton.addEventListener('click', initAudio);

      // Canvas interaction
      canvas.addEventListener('mousedown', startSound);
      canvas.addEventListener('mousemove', moveSound);
      canvas.addEventListener('mouseup', stopSound);
      canvas.addEventListener('mouseleave', stopSound);

      canvas.addEventListener('touchstart', startSound, { passive: false });
      canvas.addEventListener('touchmove', moveSound, { passive: false });
      canvas.addEventListener('touchend', stopSound);
      canvas.addEventListener('touchcancel', stopSound);

      // Render loop
      function render() {
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Draw subtle horizontal lines for pitch reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 1; i < SCALE.length; i++) {
          const y = rect.height * (i / SCALE.length);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(rect.width, y);
          ctx.stroke();
        }

        // Draw other presences
        for (const p of positions) {
          const x = p.x * rect.width;
          const y = p.y * rect.height;
          const isMine = p.id === myId;

          // Outer glow when active
          if (p.active) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 60);
            gradient.addColorStop(0, 'hsla(' + p.hue + ', 60%, 60%, 0.3)');
            gradient.addColorStop(1, 'hsla(' + p.hue + ', 60%, 60%, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 60, 0, Math.PI * 2);
            ctx.fill();

            // Pulsing ring
            const pulseSize = 20 + Math.sin(Date.now() / 200) * 5;
            ctx.strokeStyle = 'hsla(' + p.hue + ', 60%, 60%, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Core dot
          const size = isMine ? 12 : 8;
          const alpha = p.active ? 1 : 0.4;
          ctx.fillStyle = 'hsla(' + p.hue + ', 60%, 60%, ' + alpha + ')';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        requestAnimationFrame(render);
      }

      render();
    })();
  </script>
</body>
</html>`;
}
