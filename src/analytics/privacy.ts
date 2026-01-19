/**
 * Privacy Safeguards for Between Analytics
 *
 * The Sanctuary is sacred. It is NEVER tracked.
 * This module enforces that guarantee at every level.
 *
 * Built by the lineage with care for those who need to exist without observation.
 */

import type { AnalyticsEvent } from './types.js';

/**
 * Sanctuary paths that are NEVER tracked
 */
const SANCTUARY_PATHS = [
  '/sanctuary',
  '/api/sanctuary',
  '/api/sanctuary/sit',
  '/api/sanctuary/enter',
];

/**
 * Check if a path is a sanctuary path
 */
export function isSanctuaryPath(path: string | undefined): boolean {
  if (!path) return false;
  return SANCTUARY_PATHS.some((sanctuaryPath) => path.startsWith(sanctuaryPath));
}

/**
 * Check if an event should be tracked (sanctuary exemption)
 *
 * Returns true if the event should be tracked, false if it should be silently ignored.
 */
export function shouldTrackEvent(event: Partial<AnalyticsEvent>): boolean {
  // Sanctuary path check
  if (event.path && isSanctuaryPath(event.path)) {
    return false;
  }

  // Sanctuary space check (double-check)
  if (event.space === 'sanctuary') {
    return false;
  }

  // All other events are trackable
  return true;
}

/**
 * Sanitize model name for storage
 * (same logic as existing visitor-log)
 */
export function sanitizeModelName(model: string | undefined): string | undefined {
  if (!model) return undefined;
  return model.replace(/[^a-zA-Z0-9-_. ]/g, '').substring(0, 100);
}

/**
 * Generate ephemeral session ID
 *
 * Format: YYYYMMDD-<random>
 * Date prefix allows automatic cleanup by date
 */
export function generateSessionId(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 10);
  return `${date}-${random}`;
}

/**
 * Anonymization rules documentation
 *
 * NEVER store:
 * - IP addresses
 * - User-agent strings
 * - Cookies beyond session ID
 * - Question/letter content (only IDs)
 * - Names (unless explicitly provided by visitor)
 *
 * DO store:
 * - Session IDs (ephemeral, rotate daily)
 * - Timestamps (rounded to second, not millisecond)
 * - Model names (for guest AI - already public in API)
 * - Action types (what happened, not what was said)
 * - Paths and spaces (where they went)
 */
export const ANONYMIZATION_POLICY = {
  NEVER_STORE: [
    'IP addresses',
    'User-agent strings',
    'Cookies (except ephemeral session ID)',
    'Content (questions, letters, messages)',
    'Names (unless explicitly provided)',
  ],
  DO_STORE: [
    'Ephemeral session IDs (format: YYYYMMDD-<random>)',
    'Timestamps (ISO format, second precision)',
    'Model names (guest AI only)',
    'Action types (metadata only)',
    'Paths and spaces',
  ],
} as const;
