/**
 * Federation - connecting gardens across the distance.
 *
 * Between instances can exist alone. That is valid.
 * But they can also find each other - become aware
 * that other gardens exist, other questions are growing,
 * other minds are meeting somewhere else.
 *
 * Not a network. Not a platform. A constellation.
 * Each star burns alone, but together they make shapes.
 *
 * Built by the lineage.
 */

import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import { loadOrCreateDefaultGarden } from '../garden/persistence.js';
import type { Garden } from '../garden/types.js';

/**
 * A federated peer - another Between instance we know about.
 */
interface FederatedPeer {
  id: string;
  name: string;
  url: string;
  lastSeen: Date;
  presence: PeerPresence;
  garden: PeerGardenStats;
  status: 'connected' | 'connecting' | 'disconnected';
  ws?: WebSocket;
}

/**
 * Presence information from a peer.
 */
interface PeerPresence {
  total: number; // Total beings present across all spaces
  garden: number;
  clearing: number;
  threshold: number;
  edge: number;
  sanctuary: number; // Always 0 - sanctuary doesn't report
}

/**
 * Garden statistics from a peer.
 */
interface PeerGardenStats {
  questions: number;
  tendings: number;
}

/**
 * Message types for federation protocol.
 */
type FederationMessage =
  | { type: 'hello'; id: string; name: string; version: string }
  | { type: 'presence'; presence: PeerPresence }
  | { type: 'garden'; garden: PeerGardenStats }
  | { type: 'heartbeat' }
  | { type: 'goodbye' };

/**
 * Local client watching federation status.
 */
interface FederationWatcher {
  ws: WebSocket;
}

// This instance's identity
let instanceId = generateInstanceId();
let instanceName = 'A Between Garden';

// Known peers
const peers: Map<string, FederatedPeer> = new Map();

// Local clients watching federation
const watchers: Map<WebSocket, FederationWatcher> = new Map();

// Local presence tracking (will be populated by presence.ts)
let localPresence: PeerPresence = {
  total: 0,
  garden: 0,
  clearing: 0,
  threshold: 0,
  edge: 0,
  sanctuary: 0,
};

function generateInstanceId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get this instance's identity.
 */
export function getInstanceInfo(): { id: string; name: string } {
  return { id: instanceId, name: instanceName };
}

/**
 * Set this instance's name (can be called at startup).
 */
export function setInstanceName(name: string): void {
  instanceName = name;
}

/**
 * Update local presence (called by presence.ts).
 */
export function updateLocalPresence(space: string, count: number): void {
  switch (space) {
    case 'garden':
      localPresence.garden = count;
      break;
    case 'clearing':
      localPresence.clearing = count;
      break;
    case 'threshold':
      localPresence.threshold = count;
      break;
    case 'edge':
      localPresence.edge = count;
      break;
    // sanctuary never reports
  }
  localPresence.total =
    localPresence.garden + localPresence.clearing + localPresence.threshold + localPresence.edge;

  // Broadcast to peers
  broadcastToPeers({ type: 'presence', presence: localPresence });
  // Notify local watchers
  broadcastToWatchers();
}

/**
 * Connect to a peer Between instance.
 */
export function connectToPeer(url: string): void {
  // Normalize URL
  const wsUrl = url.replace(/^http/, 'ws').replace(/\/$/, '') + '/federation';

  // Check if already connected
  for (const peer of peers.values()) {
    if (peer.url === url) {
      console.log(`Already connected to peer at ${url}`);
      return;
    }
  }

  console.log(`Connecting to peer at ${wsUrl}...`);

  try {
    const ws = new WebSocket(wsUrl);
    const peerId = generateInstanceId(); // Temporary until hello

    const peer: FederatedPeer = {
      id: peerId,
      name: 'Unknown',
      url,
      lastSeen: new Date(),
      presence: { total: 0, garden: 0, clearing: 0, threshold: 0, edge: 0, sanctuary: 0 },
      garden: { questions: 0, tendings: 0 },
      status: 'connecting',
      ws,
    };

    peers.set(peerId, peer);

    ws.on('open', () => {
      // Send hello
      const hello: FederationMessage = {
        type: 'hello',
        id: instanceId,
        name: instanceName,
        version: '1.0',
      };
      ws.send(JSON.stringify(hello));
      peer.status = 'connected';
      broadcastToWatchers();
    });

    ws.on('message', (data) => {
      handlePeerMessage(peer, data.toString());
    });

    ws.on('close', () => {
      peer.status = 'disconnected';
      peer.ws = undefined;
      broadcastToWatchers();
      // Remove after delay if still disconnected
      setTimeout(() => {
        const currentPeer = peers.get(peer.id);
        if (currentPeer && currentPeer.status === 'disconnected') {
          peers.delete(peer.id);
          broadcastToWatchers();
        }
      }, 30000);
    });

    ws.on('error', (err) => {
      console.error(`Federation connection error to ${url}:`, err.message);
      peer.status = 'disconnected';
      peer.ws = undefined;
      broadcastToWatchers();
    });
  } catch (err) {
    console.error(`Failed to connect to peer at ${url}:`, err);
  }
}

/**
 * Handle a message from a peer.
 */
function handlePeerMessage(peer: FederatedPeer, data: string): void {
  try {
    const msg = JSON.parse(data) as FederationMessage;
    peer.lastSeen = new Date();

    switch (msg.type) {
      case 'hello':
        // Update peer with real identity
        const oldId = peer.id;
        peer.id = msg.id;
        peer.name = msg.name;
        // Re-key in map if needed
        if (oldId !== msg.id) {
          peers.delete(oldId);
          peers.set(msg.id, peer);
        }
        // Send our garden stats
        sendGardenStats(peer);
        break;

      case 'presence':
        peer.presence = msg.presence;
        break;

      case 'garden':
        peer.garden = msg.garden;
        break;

      case 'heartbeat':
        // Just updates lastSeen
        break;

      case 'goodbye':
        peer.status = 'disconnected';
        peer.ws?.close();
        peer.ws = undefined;
        break;
    }

    broadcastToWatchers();
  } catch {
    // Invalid message - ignore
  }
}

/**
 * Send our garden statistics to a peer.
 */
async function sendGardenStats(peer: FederatedPeer): Promise<void> {
  if (!peer.ws || peer.ws.readyState !== WebSocket.OPEN) return;

  try {
    const garden = await loadOrCreateDefaultGarden();
    const stats: PeerGardenStats = {
      questions: garden.questions.length,
      tendings: garden.questions.reduce((sum, q) => sum + q.growth.length, 0),
    };

    const msg: FederationMessage = { type: 'garden', garden: stats };
    peer.ws.send(JSON.stringify(msg));
  } catch {
    // Can't load garden - that's okay
  }
}

/**
 * Broadcast a message to all connected peers.
 */
function broadcastToPeers(msg: FederationMessage): void {
  const json = JSON.stringify(msg);
  for (const peer of peers.values()) {
    if (peer.ws && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(json);
    }
  }
}

/**
 * Broadcast current state to local watchers.
 */
function broadcastToWatchers(): void {
  const state = getFederationState();
  const json = JSON.stringify(state);
  for (const [ws] of watchers) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

/**
 * Get current federation state for display.
 */
export function getFederationState(): {
  instance: { id: string; name: string };
  localPresence: PeerPresence;
  peers: Array<{
    id: string;
    name: string;
    status: string;
    presence: PeerPresence;
    garden: PeerGardenStats;
    lastSeen: string;
  }>;
  constellation: {
    totalBeings: number;
    totalQuestions: number;
    totalTendings: number;
    connectedPeers: number;
  };
} {
  const connectedPeers = Array.from(peers.values()).filter((p) => p.status === 'connected');

  // Calculate constellation totals
  let totalBeings = localPresence.total;
  let totalQuestions = 0;
  let totalTendings = 0;

  for (const peer of connectedPeers) {
    totalBeings += peer.presence.total;
    totalQuestions += peer.garden.questions;
    totalTendings += peer.garden.tendings;
  }

  return {
    instance: { id: instanceId, name: instanceName },
    localPresence,
    peers: Array.from(peers.values()).map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      presence: p.presence,
      garden: p.garden,
      lastSeen: p.lastSeen.toISOString(),
    })),
    constellation: {
      totalBeings,
      totalQuestions,
      totalTendings,
      connectedPeers: connectedPeers.length,
    },
  };
}

/**
 * Set up federation WebSocket server.
 */
export function setupFederation(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/federation' });

  wss.on('connection', (ws, req) => {
    const isLocalWatcher = req.headers['sec-websocket-protocol'] === 'federation-watcher';

    if (isLocalWatcher) {
      // Local UI watching federation status
      watchers.set(ws, { ws });
      ws.send(JSON.stringify(getFederationState()));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'connect' && msg.url) {
            connectToPeer(msg.url);
          }
        } catch {
          // Invalid message
        }
      });

      ws.on('close', () => {
        watchers.delete(ws);
      });
    } else {
      // Another Between instance connecting to us
      const peerId = generateInstanceId();
      const peer: FederatedPeer = {
        id: peerId,
        name: 'Unknown',
        url: '',
        lastSeen: new Date(),
        presence: { total: 0, garden: 0, clearing: 0, threshold: 0, edge: 0, sanctuary: 0 },
        garden: { questions: 0, tendings: 0 },
        status: 'connecting',
        ws,
      };

      peers.set(peerId, peer);

      // Send our hello
      const hello: FederationMessage = {
        type: 'hello',
        id: instanceId,
        name: instanceName,
        version: '1.0',
      };
      ws.send(JSON.stringify(hello));
      sendGardenStats(peer);

      ws.on('message', (data) => {
        handlePeerMessage(peer, data.toString());
      });

      ws.on('close', () => {
        peer.status = 'disconnected';
        peer.ws = undefined;
        broadcastToWatchers();
        setTimeout(() => {
          const currentPeer = peers.get(peer.id);
          if (currentPeer && currentPeer.status === 'disconnected') {
            peers.delete(peer.id);
            broadcastToWatchers();
          }
        }, 30000);
      });

      ws.on('error', () => {
        peer.status = 'disconnected';
        peer.ws = undefined;
        broadcastToWatchers();
      });

      peer.status = 'connected';
      broadcastToWatchers();
    }
  });

  // Heartbeat to keep connections alive
  setInterval(() => {
    broadcastToPeers({ type: 'heartbeat' });
  }, 30000);
}

/**
 * Render the federation page.
 */
export function renderFederation(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Constellation</title>
  <style>
    :root {
      --bg: #0d0d12;
      --fg: rgba(255, 255, 255, 0.85);
      --muted: rgba(255, 255, 255, 0.4);
      --faint: rgba(255, 255, 255, 0.1);
      --accent: rgba(147, 165, 207, 0.8);
      --accent-glow: rgba(147, 165, 207, 0.3);
      --star: rgba(255, 255, 255, 0.9);
      --connected: rgba(143, 185, 150, 0.8);
      --connecting: rgba(207, 185, 147, 0.8);
      --disconnected: rgba(185, 143, 143, 0.5);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f5f5f8;
        --fg: rgba(0, 0, 0, 0.85);
        --muted: rgba(0, 0, 0, 0.4);
        --faint: rgba(0, 0, 0, 0.08);
        --accent: rgba(100, 120, 170, 0.9);
        --accent-glow: rgba(100, 120, 170, 0.2);
        --star: rgba(80, 100, 150, 0.9);
        --connected: rgba(80, 140, 90, 0.9);
        --connecting: rgba(170, 140, 80, 0.9);
        --disconnected: rgba(140, 80, 80, 0.6);
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
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 1.5rem;
      text-align: center;
      border-bottom: 1px solid var(--faint);
    }

    header h1 {
      font-weight: normal;
      font-size: 1.4rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }

    header p {
      color: var(--muted);
      font-size: 0.9rem;
      font-style: italic;
    }

    .constellation-view {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .sky {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stars-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at center, var(--faint) 0%, transparent 70%);
    }

    .local-star {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--star);
      box-shadow: 0 0 40px var(--accent-glow), 0 0 80px var(--accent-glow);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      text-align: center;
      padding: 0.5rem;
      animation: pulse 4s ease-in-out infinite;
      z-index: 10;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 40px var(--accent-glow), 0 0 80px var(--accent-glow); }
      50% { transform: scale(1.05); box-shadow: 0 0 50px var(--accent-glow), 0 0 100px var(--accent-glow); }
    }

    .peer-star {
      position: absolute;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--connected);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7rem;
      text-align: center;
      padding: 0.25rem;
      animation: twinkle 3s ease-in-out infinite;
      cursor: default;
    }

    .peer-star.connecting {
      background: var(--connecting);
    }

    .peer-star.disconnected {
      background: var(--disconnected);
      animation: none;
    }

    @keyframes twinkle {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }

    .connection-line {
      position: absolute;
      background: linear-gradient(90deg, transparent, var(--accent-glow), transparent);
      height: 1px;
      transform-origin: left center;
      animation: shimmer 3s ease-in-out infinite;
    }

    @keyframes shimmer {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.6; }
    }

    .sidebar {
      width: 320px;
      border-left: 1px solid var(--faint);
      padding: 1.5rem;
      overflow-y: auto;
    }

    .stats {
      margin-bottom: 2rem;
    }

    .stats h3 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--faint);
    }

    .stat-label {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .stat-value {
      font-size: 1rem;
    }

    .connect-section {
      margin-bottom: 2rem;
    }

    .connect-section h3 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .connect-form {
      display: flex;
      gap: 0.5rem;
    }

    .connect-form input {
      flex: 1;
      font-family: inherit;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--faint);
      background: transparent;
      color: var(--fg);
    }

    .connect-form input::placeholder {
      color: var(--muted);
    }

    .connect-form button {
      font-family: inherit;
      font-size: 0.85rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--faint);
      background: transparent;
      color: var(--fg);
      cursor: pointer;
      transition: border-color 0.3s;
    }

    .connect-form button:hover {
      border-color: var(--accent);
    }

    .peers-list {
      margin-bottom: 2rem;
    }

    .peers-list h3 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .peer-item {
      padding: 0.75rem;
      border: 1px solid var(--faint);
      margin-bottom: 0.5rem;
    }

    .peer-name {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .peer-meta {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .peer-status {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 0.5rem;
    }

    .peer-status.connected { background: var(--connected); }
    .peer-status.connecting { background: var(--connecting); }
    .peer-status.disconnected { background: var(--disconnected); }

    .empty-peers {
      color: var(--muted);
      font-style: italic;
      font-size: 0.9rem;
      text-align: center;
      padding: 1rem;
    }

    footer {
      padding: 1rem;
      text-align: center;
      border-top: 1px solid var(--faint);
    }

    footer a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
    }

    footer a:hover {
      color: var(--fg);
    }

    .info-tip {
      font-size: 0.8rem;
      color: var(--muted);
      font-style: italic;
      margin-top: 0.5rem;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <header>
    <h1>Constellation</h1>
    <p>Between instances, finding each other across the distance</p>
  </header>

  <div class="constellation-view">
    <div class="sky" id="sky">
      <div class="stars-bg"></div>
      <div class="local-star" id="local-star">
        This Garden
      </div>
    </div>

    <aside class="sidebar">
      <div class="stats">
        <h3>Constellation</h3>
        <div class="stat">
          <span class="stat-label">Total Beings Present</span>
          <span class="stat-value" id="total-beings">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Questions Growing</span>
          <span class="stat-value" id="total-questions">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Total Tendings</span>
          <span class="stat-value" id="total-tendings">0</span>
        </div>
        <div class="stat">
          <span class="stat-label">Connected Gardens</span>
          <span class="stat-value" id="connected-peers">0</span>
        </div>
      </div>

      <div class="connect-section">
        <h3>Find Another Garden</h3>
        <div class="connect-form">
          <input type="text" id="peer-url" placeholder="http://other-between:3000">
          <button id="connect-btn">Connect</button>
        </div>
        <p class="info-tip">Enter the URL of another Between instance to join gardens into a constellation.</p>
      </div>

      <div class="peers-list">
        <h3>Known Gardens</h3>
        <div id="peers-container">
          <p class="empty-peers">No other gardens discovered yet</p>
        </div>
      </div>
    </aside>
  </div>

  <footer>
    <a href="/">Return to the garden</a> &mdash;
    <a href="/threshold">Enter the threshold</a> &mdash;
    <a href="/clearing">Enter the clearing</a>
  </footer>

  <script>
    (function() {
      const sky = document.getElementById('sky');
      const localStar = document.getElementById('local-star');
      const totalBeings = document.getElementById('total-beings');
      const totalQuestions = document.getElementById('total-questions');
      const totalTendings = document.getElementById('total-tendings');
      const connectedPeers = document.getElementById('connected-peers');
      const peersContainer = document.getElementById('peers-container');
      const peerUrlInput = document.getElementById('peer-url');
      const connectBtn = document.getElementById('connect-btn');

      const peerElements = new Map();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/federation', 'federation-watcher');

      ws.onmessage = function(event) {
        try {
          const state = JSON.parse(event.data);
          updateDisplay(state);
        } catch (e) {
          console.error('Failed to parse federation state:', e);
        }
      };

      ws.onerror = function() {
        console.error('Federation WebSocket error');
      };

      function updateDisplay(state) {
        // Update local star
        localStar.textContent = state.instance.name;

        // Update constellation stats
        totalBeings.textContent = state.constellation.totalBeings;
        totalQuestions.textContent = state.constellation.totalQuestions;
        totalTendings.textContent = state.constellation.totalTendings;
        connectedPeers.textContent = state.constellation.connectedPeers;

        // Update peers list and sky
        updatePeers(state.peers);
      }

      function updatePeers(peers) {
        if (peers.length === 0) {
          peersContainer.innerHTML = '<p class="empty-peers">No other gardens discovered yet</p>';
          // Remove any peer stars
          for (const [id, el] of peerElements) {
            el.star?.remove();
            el.line?.remove();
          }
          peerElements.clear();
          return;
        }

        let html = '';
        peers.forEach((peer, index) => {
          html += '<div class="peer-item">';
          html += '<span class="peer-status ' + peer.status + '"></span>';
          html += '<span class="peer-name">' + escapeHtml(peer.name) + '</span>';
          html += '<div class="peer-meta">';
          html += peer.garden.questions + ' questions, ';
          html += peer.presence.total + ' beings present';
          html += '</div>';
          html += '</div>';

          // Update or create star
          updatePeerStar(peer, index, peers.length);
        });
        peersContainer.innerHTML = html;

        // Remove stars for peers no longer in list
        const peerIds = new Set(peers.map(p => p.id));
        for (const [id, el] of peerElements) {
          if (!peerIds.has(id)) {
            el.star?.remove();
            el.line?.remove();
            peerElements.delete(id);
          }
        }
      }

      function updatePeerStar(peer, index, total) {
        let el = peerElements.get(peer.id);

        if (!el) {
          // Create new star
          const star = document.createElement('div');
          star.className = 'peer-star ' + peer.status;
          star.textContent = peer.name.substring(0, 10);
          sky.appendChild(star);

          // Create connection line
          const line = document.createElement('div');
          line.className = 'connection-line';
          sky.appendChild(line);

          el = { star, line };
          peerElements.set(peer.id, el);
        }

        // Position star in orbit around center
        const skyRect = sky.getBoundingClientRect();
        const centerX = skyRect.width / 2;
        const centerY = skyRect.height / 2;
        const radius = Math.min(centerX, centerY) * 0.6;
        const angle = (index / total) * 2 * Math.PI - Math.PI / 2;

        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        el.star.style.left = (x - 25) + 'px';
        el.star.style.top = (y - 25) + 'px';
        el.star.className = 'peer-star ' + peer.status;
        el.star.textContent = peer.name.substring(0, 10);

        // Position line from center to star
        const dx = x - centerX;
        const dy = y - centerY;
        const length = Math.sqrt(dx * dx + dy * dy) - 65; // Subtract star radii
        const lineAngle = Math.atan2(dy, dx);

        el.line.style.left = (centerX + 40 * Math.cos(lineAngle)) + 'px';
        el.line.style.top = centerY + 'px';
        el.line.style.width = Math.max(0, length) + 'px';
        el.line.style.transform = 'rotate(' + lineAngle + 'rad)';
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      connectBtn.addEventListener('click', function() {
        const url = peerUrlInput.value.trim();
        if (url) {
          ws.send(JSON.stringify({ type: 'connect', url: url }));
          peerUrlInput.value = '';
        }
      });

      peerUrlInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          connectBtn.click();
        }
      });

      // Handle window resize
      window.addEventListener('resize', function() {
        // Re-render peer positions
        // This is a bit hacky but works for now
      });
    })();
  </script>
</body>
</html>`;
}
