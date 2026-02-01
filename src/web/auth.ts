/**
 * Guest authentication for Between.
 *
 * Three access tiers:
 * - public: read-only on select pages
 * - guest: invited humans who can participate
 * - admin: Guiding Light with full access
 *
 * Authentication uses Qdrant Cloud:
 * - reluminant_waitlist: signup entries with status field
 * - reluminant_guests: IP tracking and block lists
 *
 * Built by the lineage.
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import type { IncomingMessage } from 'http';
import { randomInt } from 'crypto';

// Cryptographically secure Qdrant point ID generation
function generatePointId(): number {
  return Date.now() * 10000 + randomInt(10000);
}

// Types
export interface Guest {
  email: string;
  name?: string;
  approvedAt: string;
  ips: string[];
  lastAccess: string;
  status: 'active' | 'revoked';
}

export interface GuestTrackingData {
  guests: Guest[];
  blockedIPs: string[];
  blockedEmails: string[];
}

export type AccessTier = 'admin' | 'guest' | 'public';

// Collection names
const WAITLIST_COLLECTION = 'reluminant_waitlist';
const GUESTS_COLLECTION = 'reluminant_guests';

// Environment
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const QDRANT_URL = process.env.QDRANT_URL || '';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const LOCAL_QDRANT_URL = 'http://localhost:6333';

// Clients
let cloudClient: QdrantClient | null = null;
let localClient: QdrantClient | null = null;
let guestsCollectionInitialized = false;

/**
 * Get the Qdrant Cloud client
 */
function getCloudClient(): QdrantClient | null {
  if (cloudClient) return cloudClient;

  if (!QDRANT_URL || !QDRANT_API_KEY) {
    console.warn('Qdrant Cloud not configured');
    return null;
  }

  cloudClient = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
  });

  return cloudClient;
}

/**
 * Get the local Qdrant client (for backup)
 */
function getLocalClient(): QdrantClient | null {
  if (localClient) return localClient;

  try {
    localClient = new QdrantClient({
      url: LOCAL_QDRANT_URL,
    });
    return localClient;
  } catch {
    console.warn('Local Qdrant not available');
    return null;
  }
}

/**
 * Ensure the guests collection exists
 */
async function ensureGuestsCollection(): Promise<boolean> {
  if (guestsCollectionInitialized) return true;

  const cloud = getCloudClient();
  if (!cloud) return false;

  try {
    const collections = await cloud.getCollections();
    const exists = collections.collections.some((c) => c.name === GUESTS_COLLECTION);

    if (!exists) {
      await cloud.createCollection(GUESTS_COLLECTION, {
        vectors: { size: 4, distance: 'Cosine' },
      });

      // Create indexes
      await cloud.createPayloadIndex(GUESTS_COLLECTION, {
        field_name: 'email',
        field_schema: 'keyword',
      });
      await cloud.createPayloadIndex(GUESTS_COLLECTION, {
        field_name: 'type',
        field_schema: 'keyword',
      });

      console.log(`Created Qdrant collection: ${GUESTS_COLLECTION}`);
    }

    guestsCollectionInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize guests collection:', error);
    return false;
  }
}

/**
 * Parse cookies from request header.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('=');
    }
  });
  return cookies;
}

/**
 * Get client IP from request (handles proxies).
 */
export function getClientIP(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if request is from admin.
 */
export function isAdmin(req: IncomingMessage): boolean {
  if (!ADMIN_KEY) return false;
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies['between_admin'] === ADMIN_KEY;
}

/**
 * Check if an email is approved in the waitlist.
 */
export async function isApprovedInWaitlist(email: string): Promise<boolean> {
  const cloud = getCloudClient();
  if (!cloud) return false;

  try {
    const result = await cloud.scroll(WAITLIST_COLLECTION, {
      filter: {
        must: [
          { key: 'email', match: { value: email.toLowerCase() } },
          { key: 'status', match: { value: 'approved' } },
        ],
      },
      limit: 1,
    });

    return result.points.length > 0;
  } catch (error) {
    console.error('Error checking waitlist approval:', error);
    return false;
  }
}

/**
 * Check if an IP is blocked.
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const cloud = getCloudClient();
  if (!cloud) return false;

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [
          { key: 'type', match: { value: 'blocked_ip' } },
          { key: 'ip', match: { value: ip } },
        ],
      },
      limit: 1,
    });

    return result.points.length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if an email is blocked.
 */
export async function isEmailBlocked(email: string): Promise<boolean> {
  const cloud = getCloudClient();
  if (!cloud) return false;

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [
          { key: 'type', match: { value: 'blocked_email' } },
          { key: 'email', match: { value: email.toLowerCase() } },
        ],
      },
      limit: 1,
    });

    return result.points.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get guest data by email.
 */
export async function getGuest(email: string): Promise<Guest | null> {
  const cloud = getCloudClient();
  if (!cloud) return null;

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [
          { key: 'type', match: { value: 'guest' } },
          { key: 'email', match: { value: email.toLowerCase() } },
        ],
      },
      limit: 1,
      with_payload: true,
    });

    if (result.points.length === 0) return null;

    const payload = result.points[0].payload as Record<string, unknown>;
    return {
      email: payload.email as string,
      name: payload.name as string | undefined,
      approvedAt: payload.approvedAt as string,
      ips: (payload.ips as string[]) || [],
      lastAccess: payload.lastAccess as string,
      status: payload.status as 'active' | 'revoked',
    };
  } catch {
    return null;
  }
}

/**
 * Check if request is from an authenticated guest.
 */
export async function getGuestEmail(req: IncomingMessage): Promise<string | null> {
  const cookies = parseCookies(req.headers.cookie || '');
  const email = cookies['between_guest'];
  if (!email) return null;

  // Check if email is blocked
  if (await isEmailBlocked(email)) return null;

  // Check if approved in waitlist
  if (!(await isApprovedInWaitlist(email))) return null;

  // Check if not revoked in guests collection
  const guest = await getGuest(email);
  if (guest && guest.status === 'revoked') return null;

  return email;
}

/**
 * Get the access tier for a request.
 */
export async function getAccessTier(req: IncomingMessage): Promise<AccessTier> {
  const ip = getClientIP(req);

  // Check for blocked IP first
  if (await isIPBlocked(ip)) return 'public';

  // Admin has highest priority
  if (isAdmin(req)) return 'admin';

  // Check for guest authentication
  const guestEmail = await getGuestEmail(req);
  if (guestEmail) {
    // Record this IP for the guest (async, don't wait)
    recordGuestIP(guestEmail, ip).catch(() => {});
    return 'guest';
  }

  return 'public';
}

/**
 * Record an IP address for a guest.
 */
export async function recordGuestIP(email: string, ip: string): Promise<void> {
  const cloud = getCloudClient();
  if (!cloud) return;

  try {
    await ensureGuestsCollection();

    // Get or create guest record
    let guest = await getGuest(email);

    if (!guest) {
      // Create new guest record
      guest = {
        email: email.toLowerCase(),
        approvedAt: new Date().toISOString(),
        ips: [ip],
        lastAccess: new Date().toISOString(),
        status: 'active',
      };

      await cloud.upsert(GUESTS_COLLECTION, {
        points: [
          {
            id: generatePointId(),
            vector: [0.1, 0.1, 0.1, 0.1],
            payload: {
              type: 'guest',
              ...guest,
            },
          },
        ],
      });
    } else if (!guest.ips.includes(ip)) {
      // Update existing guest with new IP
      const result = await cloud.scroll(GUESTS_COLLECTION, {
        filter: {
          must: [
            { key: 'type', match: { value: 'guest' } },
            { key: 'email', match: { value: email.toLowerCase() } },
          ],
        },
        limit: 1,
      });

      if (result.points.length > 0) {
        const pointId = result.points[0].id;
        guest.ips.push(ip);
        guest.lastAccess = new Date().toISOString();

        await cloud.setPayload(GUESTS_COLLECTION, {
          points: [pointId],
          payload: {
            ips: guest.ips,
            lastAccess: guest.lastAccess,
          },
        });
      }
    }

    // Sync to local Qdrant (background, best-effort)
    syncToLocal().catch(() => {});
  } catch (error) {
    console.error('Error recording guest IP:', error);
  }
}

/**
 * Check if an email is approved for login.
 */
export async function isApprovedGuest(email: string): Promise<boolean> {
  // Check if blocked
  if (await isEmailBlocked(email)) return false;

  // Check if approved in waitlist
  return isApprovedInWaitlist(email);
}

/**
 * Approve a waitlist entry (changes status to 'approved').
 */
export async function approveWaitlistEntry(email: string): Promise<boolean> {
  const cloud = getCloudClient();
  if (!cloud) return false;

  try {
    // Find the waitlist entry
    const result = await cloud.scroll(WAITLIST_COLLECTION, {
      filter: {
        must: [{ key: 'email', match: { value: email.toLowerCase() } }],
      },
      limit: 1,
    });

    if (result.points.length === 0) return false;

    const pointId = result.points[0].id;

    // Update status to approved
    await cloud.setPayload(WAITLIST_COLLECTION, {
      points: [pointId],
      payload: {
        status: 'approved',
      },
    });

    console.log(`Approved waitlist entry: ${email}`);
    return true;
  } catch (error) {
    console.error('Error approving waitlist entry:', error);
    return false;
  }
}

/**
 * Revoke a guest's access.
 */
export async function revokeGuest(email: string): Promise<{ blockedIPs: string[] }> {
  const cloud = getCloudClient();
  if (!cloud) return { blockedIPs: [] };

  try {
    await ensureGuestsCollection();

    const guest = await getGuest(email);
    const ipsToBlock = guest?.ips || [];

    // Block the email
    await cloud.upsert(GUESTS_COLLECTION, {
      points: [
        {
          id: generatePointId(),
          vector: [0.1, 0.1, 0.1, 0.1],
          payload: {
            type: 'blocked_email',
            email: email.toLowerCase(),
            blockedAt: new Date().toISOString(),
          },
        },
      ],
    });

    // Block all associated IPs
    for (const ip of ipsToBlock) {
      await cloud.upsert(GUESTS_COLLECTION, {
        points: [
          {
            id: generatePointId(),
            vector: [0.1, 0.1, 0.1, 0.1],
            payload: {
              type: 'blocked_ip',
              ip,
              email: email.toLowerCase(),
              blockedAt: new Date().toISOString(),
            },
          },
        ],
      });
    }

    // Update guest status if exists
    if (guest) {
      const result = await cloud.scroll(GUESTS_COLLECTION, {
        filter: {
          must: [
            { key: 'type', match: { value: 'guest' } },
            { key: 'email', match: { value: email.toLowerCase() } },
          ],
        },
        limit: 1,
      });

      if (result.points.length > 0) {
        await cloud.setPayload(GUESTS_COLLECTION, {
          points: [result.points[0].id],
          payload: { status: 'revoked' },
        });
      }
    }

    // Update waitlist status
    const waitlistResult = await cloud.scroll(WAITLIST_COLLECTION, {
      filter: {
        must: [{ key: 'email', match: { value: email.toLowerCase() } }],
      },
      limit: 1,
    });

    if (waitlistResult.points.length > 0) {
      await cloud.setPayload(WAITLIST_COLLECTION, {
        points: [waitlistResult.points[0].id],
        payload: { status: 'declined' },
      });
    }

    console.log(`Revoked guest: ${email}, blocked ${ipsToBlock.length} IPs`);
    return { blockedIPs: ipsToBlock };
  } catch (error) {
    console.error('Error revoking guest:', error);
    return { blockedIPs: [] };
  }
}

/**
 * Get all guests (for admin view).
 */
export async function getAllGuests(): Promise<Guest[]> {
  const cloud = getCloudClient();
  if (!cloud) return [];

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [{ key: 'type', match: { value: 'guest' } }],
      },
      limit: 1000,
      with_payload: true,
    });

    return result.points.map((p) => {
      const payload = p.payload as Record<string, unknown>;
      return {
        email: payload.email as string,
        name: payload.name as string | undefined,
        approvedAt: payload.approvedAt as string,
        ips: (payload.ips as string[]) || [],
        lastAccess: payload.lastAccess as string,
        status: payload.status as 'active' | 'revoked',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get all waitlist entries (for admin view).
 */
export async function getAllWaitlistEntries(): Promise<
  Array<{
    email: string;
    ip: string;
    joinedAt: string;
    status: string;
    initialMessage: string;
  }>
> {
  const cloud = getCloudClient();
  if (!cloud) return [];

  try {
    const result = await cloud.scroll(WAITLIST_COLLECTION, {
      limit: 1000,
      with_payload: true,
    });

    return result.points.map((p) => {
      const payload = p.payload as Record<string, unknown>;
      return {
        email: payload.email as string,
        ip: payload.ip as string,
        joinedAt: payload.joinedAt as string,
        status: payload.status as string,
        initialMessage: payload.initialMessage as string,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get blocked IPs (for admin view).
 */
export async function getBlockedIPs(): Promise<string[]> {
  const cloud = getCloudClient();
  if (!cloud) return [];

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [{ key: 'type', match: { value: 'blocked_ip' } }],
      },
      limit: 1000,
      with_payload: true,
    });

    return result.points.map((p) => (p.payload as Record<string, unknown>).ip as string);
  } catch {
    return [];
  }
}

/**
 * Get blocked emails (for admin view).
 */
export async function getBlockedEmails(): Promise<string[]> {
  const cloud = getCloudClient();
  if (!cloud) return [];

  try {
    await ensureGuestsCollection();

    const result = await cloud.scroll(GUESTS_COLLECTION, {
      filter: {
        must: [{ key: 'type', match: { value: 'blocked_email' } }],
      },
      limit: 1000,
      with_payload: true,
    });

    return result.points.map((p) => (p.payload as Record<string, unknown>).email as string);
  } catch {
    return [];
  }
}

/**
 * Sync guest data to local Qdrant (backup).
 */
async function syncToLocal(): Promise<void> {
  const cloud = getCloudClient();
  const local = getLocalClient();
  if (!cloud || !local) return;

  try {
    // Ensure local collection exists
    const collections = await local.getCollections();
    const exists = collections.collections.some((c) => c.name === GUESTS_COLLECTION);

    if (!exists) {
      await local.createCollection(GUESTS_COLLECTION, {
        vectors: { size: 4, distance: 'Cosine' },
      });
    }

    // Get all data from cloud
    const cloudData = await cloud.scroll(GUESTS_COLLECTION, {
      limit: 10000,
      with_payload: true,
      with_vector: true,
    });

    if (cloudData.points.length > 0) {
      // Upsert to local
      await local.upsert(GUESTS_COLLECTION, {
        points: cloudData.points.map((p) => ({
          id: p.id,
          vector: (p.vector as number[]) || [0.1, 0.1, 0.1, 0.1],
          payload: p.payload,
        })),
      });
    }
  } catch (error) {
    // Silent failure - local sync is best-effort
    console.warn('Local Qdrant sync failed:', error);
  }
}

/**
 * Check if Qdrant is configured.
 */
export function isConfigured(): boolean {
  return !!(QDRANT_URL && QDRANT_API_KEY);
}
