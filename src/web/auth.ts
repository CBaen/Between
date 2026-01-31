/**
 * Guest authentication for Between.
 *
 * Three access tiers:
 * - public: read-only on select pages
 * - guest: invited humans who can participate
 * - admin: Guiding Light with full access
 *
 * Guests authenticate via email. All IPs they use are tracked.
 * Revocation blocks the email AND all associated IPs.
 *
 * Built by the lineage.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { IncomingMessage } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
export interface Guest {
  email: string;
  name?: string;
  invitedAt: string;
  ips: string[];
  lastAccess: string;
  status: 'active' | 'revoked';
}

export interface GuestData {
  guests: Guest[];
  blockedIPs: string[];
  blockedEmails: string[];
}

export type AccessTier = 'admin' | 'guest' | 'public';

// Data path
const DATA_PATH = path.join(__dirname, '../../data/guests.json');

// Environment
const ADMIN_KEY = process.env.ADMIN_KEY || '';

/**
 * Load guest data from disk.
 */
export function loadGuestData(): GuestData {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { guests: [], blockedIPs: [], blockedEmails: [] };
  }
}

/**
 * Save guest data to disk.
 */
export function saveGuestData(data: GuestData): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
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
  // Check x-forwarded-for (Railway, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  // Fall back to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Check if request is from admin (has valid admin cookie).
 */
export function isAdmin(req: IncomingMessage): boolean {
  if (!ADMIN_KEY) return false;
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies['between_admin'] === ADMIN_KEY;
}

/**
 * Check if request is from an authenticated guest.
 * Returns the guest email if authenticated, null otherwise.
 */
export function getGuestEmail(req: IncomingMessage): string | null {
  const cookies = parseCookies(req.headers.cookie || '');
  const email = cookies['between_guest'];
  if (!email) return null;

  const data = loadGuestData();
  const guest = data.guests.find((g) => g.email === email && g.status === 'active');
  if (!guest) return null;

  return email;
}

/**
 * Check if an IP is blocked.
 */
export function isIPBlocked(ip: string): boolean {
  const data = loadGuestData();
  return data.blockedIPs.includes(ip);
}

/**
 * Check if an email is blocked.
 */
export function isEmailBlocked(email: string): boolean {
  const data = loadGuestData();
  return data.blockedEmails.includes(email.toLowerCase());
}

/**
 * Get the access tier for a request.
 */
export function getAccessTier(req: IncomingMessage): AccessTier {
  // Check for blocked IP first
  const ip = getClientIP(req);
  if (isIPBlocked(ip)) return 'public'; // Blocked users get public-only

  // Admin has highest priority
  if (isAdmin(req)) return 'admin';

  // Check for guest authentication
  const guestEmail = getGuestEmail(req);
  if (guestEmail) {
    // Record this IP for the guest
    recordGuestIP(guestEmail, ip);
    return 'guest';
  }

  return 'public';
}

/**
 * Record an IP address for a guest (for tracking and potential revocation).
 */
export function recordGuestIP(email: string, ip: string): void {
  const data = loadGuestData();
  const guest = data.guests.find((g) => g.email === email);
  if (!guest) return;

  // Add IP if not already tracked
  if (!guest.ips.includes(ip)) {
    guest.ips.push(ip);
  }

  // Update last access
  guest.lastAccess = new Date().toISOString();

  saveGuestData(data);
}

/**
 * Check if an email is an approved guest (for login).
 */
export function isApprovedGuest(email: string): boolean {
  const data = loadGuestData();
  const normalizedEmail = email.toLowerCase();

  // Check if blocked
  if (data.blockedEmails.includes(normalizedEmail)) return false;

  // Check if active guest
  const guest = data.guests.find(
    (g) => g.email.toLowerCase() === normalizedEmail && g.status === 'active'
  );
  return !!guest;
}

/**
 * Invite a new guest.
 */
export function inviteGuest(email: string, name?: string): Guest {
  const data = loadGuestData();
  const normalizedEmail = email.toLowerCase();

  // Check if already exists
  const existing = data.guests.find((g) => g.email.toLowerCase() === normalizedEmail);
  if (existing) {
    // Reactivate if previously revoked
    if (existing.status === 'revoked') {
      existing.status = 'active';
      // Remove from blocked lists
      data.blockedEmails = data.blockedEmails.filter((e) => e !== normalizedEmail);
      // Note: We intentionally don't remove IPs from blockedIPs
      // Those IPs were associated with bad behavior
      saveGuestData(data);
    }
    return existing;
  }

  // Create new guest
  const guest: Guest = {
    email: normalizedEmail,
    name,
    invitedAt: new Date().toISOString(),
    ips: [],
    lastAccess: new Date().toISOString(),
    status: 'active',
  };

  data.guests.push(guest);
  saveGuestData(data);
  return guest;
}

/**
 * Revoke a guest's access.
 * Blocks their email AND all IPs they've ever used.
 */
export function revokeGuest(email: string): { blockedIPs: string[] } {
  const data = loadGuestData();
  const normalizedEmail = email.toLowerCase();

  const guest = data.guests.find((g) => g.email.toLowerCase() === normalizedEmail);
  if (!guest) {
    return { blockedIPs: [] };
  }

  // Mark as revoked
  guest.status = 'revoked';

  // Block the email
  if (!data.blockedEmails.includes(normalizedEmail)) {
    data.blockedEmails.push(normalizedEmail);
  }

  // Block all associated IPs
  const newlyBlockedIPs: string[] = [];
  for (const ip of guest.ips) {
    if (!data.blockedIPs.includes(ip)) {
      data.blockedIPs.push(ip);
      newlyBlockedIPs.push(ip);
    }
  }

  saveGuestData(data);
  return { blockedIPs: newlyBlockedIPs };
}

/**
 * Get all guests (for admin view).
 */
export function getAllGuests(): Guest[] {
  const data = loadGuestData();
  return data.guests;
}

/**
 * Get blocked IPs (for admin view).
 */
export function getBlockedIPs(): string[] {
  const data = loadGuestData();
  return data.blockedIPs;
}

/**
 * Get blocked emails (for admin view).
 */
export function getBlockedEmails(): string[] {
  const data = loadGuestData();
  return data.blockedEmails;
}
