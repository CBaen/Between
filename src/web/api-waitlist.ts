/**
 * Waitlist API Endpoint
 *
 * Collects emails for the reluminant.com waitlist.
 * Simple JSON file storage.
 *
 * Built by the lineage.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { notifyNewWaitlistSignup } from '../notifications/slack.js';

interface WaitlistEntry {
  email: string;
  ip: string;
  joinedAt: string;
  source: string;
  status: 'new' | 'contacted' | 'responded' | 'approved' | 'declined';
  initialMessage: string; // What the human wrote when signing up (optional)
  reluminantMessage: string; // The question/message the lineage member wants to send
  humanResponse: string; // What the human replied
  notes: string; // General notes
}

interface WaitlistStore {
  entries: WaitlistEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

let store: WaitlistStore = { entries: [] };

function isValidEmail(email: string): boolean {
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function loadWaitlist(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(WAITLIST_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    store = {
      entries: loaded.entries || [],
    };
  } catch {
    // File doesn't exist - use defaults
    store = { entries: [] };
  }
}

async function saveWaitlist(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(WAITLIST_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save waitlist:', err);
    throw err;
  }
}

function emailExists(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  return store.entries.some((e) => e.email.toLowerCase() === normalized);
}

function ipExists(ip: string): boolean {
  return store.entries.some((e) => e.ip === ip);
}

async function addEmail(
  email: string,
  ip: string,
  source = 'web',
  initialMessage = ''
): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { success: false, error: 'Email is required.' };
  }

  if (!isValidEmail(trimmed)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Check for duplicate email OR IP
  if (emailExists(trimmed) || ipExists(ip)) {
    // Return success but flag that they already exist (for UI state)
    return { success: true, alreadyExists: true };
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

  store.entries.push(entry);
  await saveWaitlist();

  return { success: true, alreadyExists: false };
}

// Initialize store on module load
loadWaitlist().catch(console.error);

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
      // Get IP address (check forwarded header for proxies, fallback to socket)
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

      // Try to parse as JSON first
      try {
        const json = JSON.parse(body);
        email = json.email;
        source = json.source || 'web';
        message = json.message || '';
      } catch {
        // Fall back to form data
        const params = new URLSearchParams(body);
        email = params.get('email') || '';
        message = params.get('message') || '';
      }

      const result = await addEmail(email, ip, source, message);

      // Send Slack notification for new signups (not duplicates)
      if (result.success && !result.alreadyExists) {
        notifyNewWaitlistSignup({
          email,
          message,
          timestamp: new Date().toISOString(),
        }).catch((err) => console.error('Failed to send waitlist notification:', err));
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
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'unknown';

    const hasSubmitted = ipExists(ip);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        hasSubmitted,
        count: store.entries.length,
      })
    );
    return true;
  }

  return false;
}

/**
 * Get all waitlist entries (for CLI/admin use).
 */
export function getWaitlistEntries(): WaitlistEntry[] {
  return [...store.entries];
}

/**
 * Get waitlist count.
 */
export function getWaitlistCount(): number {
  return store.entries.length;
}
