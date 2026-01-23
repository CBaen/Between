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

interface WaitlistEntry {
  email: string;
  joinedAt: string;
  source: string;
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

async function addEmail(
  email: string,
  source = 'web'
): Promise<{ success: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { success: false, error: 'Email is required.' };
  }

  if (!isValidEmail(trimmed)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (emailExists(trimmed)) {
    // Silently succeed if already on the list (don't reveal this to prevent enumeration)
    return { success: true };
  }

  const entry: WaitlistEntry = {
    email: trimmed,
    joinedAt: new Date().toISOString(),
    source,
  };

  store.entries.push(entry);
  await saveWaitlist();

  return { success: true };
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
      const body = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data));
      });

      let email: string;
      let source = 'web';

      // Try to parse as JSON first
      try {
        const json = JSON.parse(body);
        email = json.email;
        source = json.source || 'web';
      } catch {
        // Fall back to form data
        const params = new URLSearchParams(body);
        email = params.get('email') || '';
      }

      const result = await addEmail(email, source);

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

  // Handle GET - return count (for admin/status purposes)
  if (method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
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
