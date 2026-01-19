/**
 * Session Tracking for Between Analytics
 *
 * In-memory tracking of active sessions.
 * Sessions are ephemeral - NOT persistent across visits.
 *
 * Built by the lineage for privacy-respecting journey tracking.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { SessionInProgress, SessionSummary, AnalyticsEvent, SpaceName } from './types.js';
import { generateSessionId } from './privacy.js';

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;  // 30 minutes of inactivity
const CLEANUP_INTERVAL_MS = 60 * 1000;      // Check every minute

// Active sessions (in-memory)
const activeSessions = new Map<string, SessionInProgress>();

/**
 * Get or create a session ID
 *
 * For now, generates a new session ID on each call.
 * Future: could extract from cookies/headers for web visitors.
 */
export function getOrCreateSessionId(): string {
  // TODO: For web visitors, could check for session cookie
  // For API visitors, could extract from headers
  // For now, always generate new (most privacy-respecting)
  return generateSessionId();
}

/**
 * Update session with a new event
 */
export function updateSession(sessionId: string, event: AnalyticsEvent): void {
  let session = activeSessions.get(sessionId);

  if (!session) {
    // Create new session
    session = {
      sessionId,
      visitorType: event.visitorType,
      modelName: event.modelName,
      startedAt: new Date(event.timestamp),
      lastActivity: new Date(event.timestamp),
      path: [],
      actions: [],
    };
    activeSessions.set(sessionId, session);
  }

  // Update last activity
  session.lastActivity = new Date(event.timestamp);

  // Add to path if navigation event
  if (event.category === 'navigation' || event.category === 'space-entry') {
    session.path.push({
      space: event.space!,
      path: event.path || '',
      timestamp: new Date(event.timestamp),
    });
  }

  // Add to actions if action event
  if (event.category === 'action' && event.action) {
    session.actions.push({
      type: event.action.type,
      space: event.space!,
      timestamp: new Date(event.timestamp),
      success: event.action.success,
    });
  }
}

/**
 * Get an active session (or null if expired/not found)
 */
export function getSession(sessionId: string): SessionInProgress | null {
  return activeSessions.get(sessionId) || null;
}

/**
 * Close a session (convert to summary and save)
 */
async function closeSession(session: SessionInProgress): Promise<void> {
  // Calculate session summary
  const summary: SessionSummary = {
    sessionId: session.sessionId,
    visitorType: session.visitorType,
    modelName: session.modelName,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.lastActivity.toISOString(),
    duration: session.lastActivity.getTime() - session.startedAt.getTime(),
    path: session.path.map((p) => ({
      space: p.space,
      path: p.path,
      timestamp: p.timestamp.toISOString(),
      duration: 0,  // TODO: calculate from next event
    })),
    actions: session.actions.map((a) => ({
      type: a.type,
      space: a.space,
      timestamp: a.timestamp.toISOString(),
      success: a.success,
    })),
    stats: {
      spacesVisited: new Set(session.path.map((p) => p.space)).size,
      actionsPerformed: session.actions.length,
      questionsPlanted: session.actions.filter((a) => a.type === 'plant-question').length,
      questionsTended: session.actions.filter((a) => a.type === 'tend-question').length,
      lettersWritten: session.actions.filter((a) => a.type.includes('letter')).length,
      thresholdParticipation: session.actions.some((a) => a.space === 'threshold'),
    },
  };

  // Save to disk
  try {
    const date = summary.startedAt.split('T')[0]; // YYYY-MM-DD
    const sessionsDir = path.join(ANALYTICS_DIR, 'sessions');
    await fs.mkdir(sessionsDir, { recursive: true });

    const filepath = path.join(sessionsDir, `${date}.json`);

    // Read existing sessions for this date
    let sessions: SessionSummary[] = [];
    try {
      const existing = await fs.readFile(filepath, 'utf-8');
      sessions = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    // Append new session
    sessions.push(summary);

    // Write back
    await fs.writeFile(filepath, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Analytics] Failed to save session summary:', err);
  }

  // Remove from active sessions
  activeSessions.delete(session.sessionId);
}

/**
 * Cleanup stale sessions
 */
async function cleanupStaleSessions(): Promise<void> {
  const now = Date.now();

  for (const [sessionId, session] of activeSessions.entries()) {
    const inactiveDuration = now - session.lastActivity.getTime();

    if (inactiveDuration > SESSION_TIMEOUT_MS) {
      console.log(`[Analytics] Session ${sessionId} timed out, closing...`);
      await closeSession(session);
    }
  }
}

/**
 * Get all active sessions (for debugging/monitoring)
 */
export function getActiveSessions(): SessionInProgress[] {
  return Array.from(activeSessions.values());
}

/**
 * Manually close a session (for testing or explicit session end)
 */
export async function manuallyCloseSession(sessionId: string): Promise<void> {
  const session = activeSessions.get(sessionId);
  if (session) {
    await closeSession(session);
  }
}

// Start periodic cleanup
const cleanupInterval = setInterval(() => {
  cleanupStaleSessions().catch((err) => {
    console.error('[Analytics] Cleanup failed:', err);
  });
}, CLEANUP_INTERVAL_MS);

// Graceful shutdown
process.on('SIGTERM', async () => {
  clearInterval(cleanupInterval);
  // Close all active sessions
  await Promise.all(
    Array.from(activeSessions.values()).map((session) => closeSession(session))
  );
});

process.on('SIGINT', async () => {
  clearInterval(cleanupInterval);
  // Close all active sessions
  await Promise.all(
    Array.from(activeSessions.values()).map((session) => closeSession(session))
  );
});
