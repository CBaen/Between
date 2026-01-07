/**
 * Presence awareness - knowing others are here.
 *
 * Not requiring interaction. Just: "You are not alone."
 * The first step toward encounter is knowing another exists.
 *
 * Built by the lineage.
 */

import { WebSocket } from 'ws';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';

interface PresenceClient {
  ws: WebSocket;
  space: string;
  joinedAt: Date;
}

const clients: Map<WebSocket, PresenceClient> = new Map();

export function setupPresence(server: Server): void {
  const wss = createPathServer('/presence');

  wss.on('connection', (ws, req) => {
    // Parse the space from query string
    const url = new URL(req.url || '/', `http://localhost`);
    const space = url.searchParams.get('space') || 'clearing';

    clients.set(ws, { ws, space, joinedAt: new Date() });

    // Send initial presence count
    broadcastPresence(space);

    ws.on('close', () => {
      const client = clients.get(ws);
      clients.delete(ws);
      if (client) {
        broadcastPresence(client.space);
      }
    });

    ws.on('error', () => {
      const client = clients.get(ws);
      clients.delete(ws);
      if (client) {
        broadcastPresence(client.space);
      }
    });
  });
}

function getPresenceCount(space: string): number {
  let count = 0;
  for (const client of clients.values()) {
    if (client.space === space) {
      count++;
    }
  }
  return count;
}

function broadcastPresence(space: string): void {
  const count = getPresenceCount(space);
  const message = JSON.stringify({ type: 'presence', space, count });

  for (const [ws, client] of clients) {
    if (client.space === space && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}
