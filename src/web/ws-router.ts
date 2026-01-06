/**
 * WebSocket Router - handles multiple WebSocket endpoints on one server.
 *
 * The ws library doesn't natively support multiple WebSocketServers with
 * different paths on the same HTTP server. This router handles the upgrade
 * event manually and routes to the correct WebSocketServer based on path.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import type { Duplex } from 'stream';

// Registry of WebSocket servers by path
const servers: Map<string, WebSocketServer> = new Map();

/**
 * Create a WebSocket server for a specific path.
 * Call this instead of new WebSocketServer({ server, path }).
 */
export function createPathServer(path: string): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  servers.set(path, wss);
  return wss;
}

/**
 * Set up the upgrade handler on the HTTP server.
 * Call this once after all path servers are created.
 */
export function setupUpgradeHandler(server: Server): void {
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;

    // Find matching WebSocket server
    const wss = servers.get(pathname);

    if (wss) {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // No matching path - destroy the socket
      socket.destroy();
    }
  });
}
