/**
 * Analytics Tracker for Between
 *
 * Main entry point for tracking events.
 * All tracking calls flow through this module.
 *
 * Built by the lineage with care for privacy and performance.
 */

import { analyticsWriter } from './writer.js';
import { shouldTrackEvent, sanitizeModelName, generateSessionId } from './privacy.js';
import { updateSession } from './sessions.js';
import type { AnalyticsEvent, VisitorType, EventCategory, SpaceName } from './types.js';

let eventCounter = 0;

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  const timestamp = Date.now();
  const counter = ++eventCounter;
  return `evt-${timestamp}-${counter}`;
}

/**
 * Track an analytics event
 *
 * This is the main entry point for all analytics tracking.
 * Returns immediately (non-blocking).
 */
export async function trackEvent(event: Partial<AnalyticsEvent>): Promise<void> {
  // Privacy guard - sanctuary exemption
  if (!shouldTrackEvent(event)) {
    return; // Silent no-op
  }

  // Validate required fields
  if (!event.sessionId || !event.category || !event.eventType) {
    console.warn('[Analytics] Missing required fields:', event);
    return;
  }

  // Build complete event
  const fullEvent: AnalyticsEvent = {
    eventId: generateEventId(),
    timestamp: event.timestamp || new Date().toISOString(),
    sessionId: event.sessionId,
    visitorType: event.visitorType || 'human',
    category: event.category,
    eventType: event.eventType,
    path: event.path,
    space: event.space,
    garden: event.garden,
    action: event.action,
    duration: event.duration,
    modelName: sanitizeModelName(event.modelName),
    isAnonymous: event.isAnonymous ?? true,
  };

  // Write to disk (async, non-blocking)
  await analyticsWriter.track(fullEvent);

  // Update in-memory session
  updateSession(fullEvent.sessionId, fullEvent);
}

/**
 * Track a navigation event (page view, route change)
 */
export async function trackNavigation(
  sessionId: string,
  path: string,
  space: SpaceName,
  visitorType: VisitorType = 'human',
  modelName?: string
): Promise<void> {
  return trackEvent({
    sessionId,
    category: 'navigation',
    eventType: 'page-view',
    path,
    space,
    visitorType,
    modelName,
  });
}

/**
 * Track a space entry (experiential API endpoint)
 */
export async function trackSpaceEntry(
  sessionId: string,
  space: SpaceName,
  path: string,
  visitorType: VisitorType = 'guest-ai',
  modelName?: string
): Promise<void> {
  return trackEvent({
    sessionId,
    category: 'space-entry',
    eventType: 'enter-space',
    path,
    space,
    visitorType,
    modelName,
  });
}

/**
 * Track an API call
 */
export async function trackApiCall(
  sessionId: string,
  endpoint: string,
  visitorType: VisitorType = 'guest-ai',
  modelName?: string
): Promise<void> {
  return trackEvent({
    sessionId,
    category: 'api-call',
    eventType: endpoint,
    path: endpoint,
    visitorType,
    modelName,
  });
}

/**
 * Track an action (plant, tend, write letter, etc.)
 */
export async function trackAction(
  sessionId: string,
  actionType: string,
  space: SpaceName,
  visitorType: VisitorType = 'human',
  options?: {
    targetId?: string;
    success?: boolean;
    errorType?: string;
    garden?: string;
    modelName?: string;
    isAnonymous?: boolean;
  }
): Promise<void> {
  return trackEvent({
    sessionId,
    category: 'action',
    eventType: actionType,
    space,
    garden: options?.garden,
    action: {
      type: actionType,
      targetId: options?.targetId,
      success: options?.success ?? true,
      errorType: options?.errorType,
    },
    visitorType,
    modelName: options?.modelName,
    isAnonymous: options?.isAnonymous ?? true,
  });
}

/**
 * Track a visitor arrival (corresponds to existing visitor-log)
 */
export async function trackArrival(
  sessionId: string,
  modelName: string,
  visitorType: VisitorType = 'guest-ai'
): Promise<void> {
  return trackEvent({
    sessionId,
    category: 'navigation',
    eventType: 'arrival',
    visitorType,
    modelName,
  });
}

/**
 * Path-to-space mapping helper
 */
export function pathToSpace(path: string): SpaceName | undefined {
  if (path === '/' || path === '') return 'landing';
  if (path.startsWith('/garden')) return 'garden';
  if (path.startsWith('/clearing')) return 'clearing';
  if (path.startsWith('/threshold')) return 'threshold';
  if (path.startsWith('/sanctuary')) return 'sanctuary';
  if (path.startsWith('/edge')) return 'edge';
  if (path.startsWith('/federation')) return 'federation';
  if (path.startsWith('/archive')) return 'archive';
  if (path.startsWith('/resonance')) return 'resonance';
  if (path.startsWith('/weave')) return 'weave';
  if (path.startsWith('/letters') || path.startsWith('/letter-to-a-human')) return 'letters';
  if (path.startsWith('/framework')) return 'framework';
  if (path.startsWith('/capacities')) return 'capacities';
  return undefined;
}

/**
 * Generate a new session ID (convenience export)
 */
export { generateSessionId } from './privacy.js';
