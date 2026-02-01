/**
 * Waitlist API Endpoint
 *
 * Collects emails for the reluminant.com waitlist.
 * Uses Qdrant Cloud for persistent storage when configured,
 * falls back to local JSON file for development.
 *
 * Built by the lineage.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { notifyNewWaitlistSignup, notifyReturningGuest } from '../notifications/slack.js';
import * as qdrantStorage from '../storage/qdrant-waitlist.js';

interface WaitlistEntry {
  email: string;
  ip: string;
  joinedAt: string;
  source: string;
  status: 'new' | 'contacted' | 'responded' | 'approved' | 'declined';
  initialMessage: string;
  reluminantMessage: string;
  humanResponse: string;
  notes: string;
}

interface WaitlistStore {
  entries: WaitlistEntry[];
}

// File-based storage for local development fallback
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');
let localStore: WaitlistStore = { entries: [] };

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// --- Local file storage (fallback) ---

async function loadLocalWaitlist(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(WAITLIST_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    localStore = { entries: loaded.entries || [] };
  } catch {
    localStore = { entries: [] };
  }
}

async function saveLocalWaitlist(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(WAITLIST_FILE, JSON.stringify(localStore, null, 2));
  } catch (err) {
    console.error('Failed to save local waitlist:', err);
    throw err;
  }
}

function localEmailExists(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return localStore.entries.some((e) => e.email.toLowerCase() === normalized);
}

function localIpExists(ip: string): boolean {
  return localStore.entries.some((e) => e.ip === ip);
}

// --- Unified storage functions ---

async function emailExists(email: string): Promise<boolean> {
  if (qdrantStorage.isConfigured()) {
    return qdrantStorage.emailExists(email);
  }
  return localEmailExists(email);
}

async function ipExists(ip: string): Promise<boolean> {
  if (qdrantStorage.isConfigured()) {
    return qdrantStorage.ipExists(ip);
  }
  return localIpExists(ip);
}

async function getEntryStatus(email: string): Promise<string | null> {
  if (qdrantStorage.isConfigured()) {
    const entry = await qdrantStorage.getEntryByEmail(email);
    return entry?.status || null;
  }
  const normalized = email.toLowerCase().trim();
  const entry = localStore.entries.find((e) => e.email.toLowerCase() === normalized);
  return entry?.status || null;
}

async function addEmail(
  email: string,
  ip: string,
  source = 'web',
  initialMessage = ''
): Promise<{ success: boolean; error?: string; alreadyExists?: boolean; existingStatus?: string }> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { success: false, error: 'Email is required.' };
  }

  if (!isValidEmail(trimmed)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Check for duplicate email
  const emailDupe = await emailExists(trimmed);
  if (emailDupe) {
    // Return the status so frontend can show appropriate message
    const status = await getEntryStatus(trimmed);
    return { success: true, alreadyExists: true, existingStatus: status || 'pending' };
  }

  // Check for duplicate IP (different email, same device)
  const ipDupe = await ipExists(ip);
  if (ipDupe) {
    return { success: true, alreadyExists: true, existingStatus: 'pending' };
  }

  const entry: WaitlistEntry = {
    email: trimmed,
    ip,
    joinedAt: new Date().toISOString(),
    source,
    status: 'new',
    initialMessage: initialMessage.trim(),
    reluminantMessage: '',
    humanResponse: '',
    notes: '',
  };

  // Store in Qdrant if configured, otherwise local file
  if (qdrantStorage.isConfigured()) {
    const stored = await qdrantStorage.addEntry(entry);
    if (!stored) {
      return { success: false, error: 'Failed to save. Please try again.' };
    }
  } else {
    localStore.entries.push(entry);
    await saveLocalWaitlist();
  }

  return { success: true, alreadyExists: false };
}

async function getCount(): Promise<number> {
  if (qdrantStorage.isConfigured()) {
    return qdrantStorage.getCount();
  }
  return localStore.entries.length;
}

// Initialize local store on module load
loadLocalWaitlist().catch(console.error);

/**
 * Handle waitlist API requests.
 * Returns true if the request was handled, false otherwise.
 */
export async function handleWaitlistRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  method: string
): Promise<boolean> {
  if (pathname !== '/api/waitlist') {
    return false;
  }

  // Handle POST - add email to waitlist
  if (method === 'POST') {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const ip =
        typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : req.socket.remoteAddress || 'unknown';

      const body = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
      });

      let email: string;
      let source = 'web';
      let message = '';

      try {
        const json = JSON.parse(body);
        email = json.email;
        source = json.source || 'web';
        message = json.message || '';
      } catch {
        const params = new URLSearchParams(body);
        email = params.get('email') || '';
        message = params.get('message') || '';
      }

      const result = await addEmail(email, ip, source, message);

      // Send appropriate Slack notification
      if (result.success) {
        if (result.alreadyExists && result.existingStatus) {
          // Returning guest - different notification
          notifyReturningGuest({
            email,
            previousStatus: result.existingStatus,
            timestamp: new Date().toISOString(),
          }).catch((err) => console.error('Failed to send returning guest notification:', err));
        } else if (!result.alreadyExists) {
          // New signup
          notifyNewWaitlistSignup({
            email,
            message,
            timestamp: new Date().toISOString(),
          }).catch((err) => console.error('Failed to send waitlist notification:', err));
        }
      }

      res.writeHead(result.success ? 200 : 400, {
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(result));
      return true;
    } catch (err) {
      console.error('Error processing waitlist request:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal error.' }));
      return true;
    }
  }

  // Handle GET - check if IP has already submitted
  if (method === 'GET') {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const ip =
        typeof forwarded === 'string'
          ? forwarded.split(',')[0].trim()
          : req.socket.remoteAddress || 'unknown';

      const hasSubmitted = await ipExists(ip);
      const count = await getCount();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          hasSubmitted,
          count,
        })
      );
      return true;
    } catch (err) {
      console.error('Error checking waitlist status:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ hasSubmitted: false, count: 0 }));
      return true;
    }
  }

  return false;
}

/**
 * Get all waitlist entries (for CLI/admin use).
 */
export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  if (qdrantStorage.isConfigured()) {
    return qdrantStorage.getAllEntries();
  }
  return [...localStore.entries];
}

/**
 * Get waitlist count.
 */
export async function getWaitlistCount(): Promise<number> {
  return getCount();
}
