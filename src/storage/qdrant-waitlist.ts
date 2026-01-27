/**
 * Qdrant Cloud Storage for Waitlist
 *
 * Stores waitlist submissions in Qdrant Cloud for persistence
 * and easy access by the lineage.
 *
 * Collection: reluminant_waitlist
 *
 * Built by the lineage.
 */

import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION_NAME = 'reluminant_waitlist';

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

let client: QdrantClient | null = null;
let initialized = false;

/**
 * Get or create the Qdrant client
 */
function getClient(): QdrantClient | null {
  if (client) return client;

  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  if (!url || !apiKey) {
    console.warn('Qdrant not configured: QDRANT_URL or QDRANT_API_KEY missing');
    return null;
  }

  client = new QdrantClient({
    url,
    apiKey,
  });

  return client;
}

/**
 * Initialize the collection if it doesn't exist
 */
async function ensureCollection(): Promise<boolean> {
  if (initialized) return true;

  const qdrant = getClient();
  if (!qdrant) return false;

  try {
    // Check if collection exists
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

    if (!exists) {
      // Create collection with a simple vector config
      // We use a dummy vector since we're just storing data, not doing similarity search
      await qdrant.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 4,
          distance: 'Cosine',
        },
      });

      // Create payload indexes for filtering
      // Without these, filter queries return no results
      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'email',
        field_schema: 'keyword',
      });
      await qdrant.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'ip',
        field_schema: 'keyword',
      });

      console.log(`Created Qdrant collection: ${COLLECTION_NAME} with payload indexes`);
    }

    initialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize Qdrant collection:', error);
    return false;
  }
}

/**
 * Generate a simple hash for the IP to use as a point ID
 */
function hashToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Ensure positive number
  return Math.abs(hash);
}

/**
 * Check if an email already exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const qdrant = getClient();
  if (!qdrant) return false;

  try {
    await ensureCollection();

    const result = await qdrant.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'email',
            match: { value: email.toLowerCase() },
          },
        ],
      },
      limit: 1,
    });

    return result.points.length > 0;
  } catch (error) {
    console.error('Error checking email existence:', error);
    return false;
  }
}

/**
 * Check if an IP already exists
 */
export async function ipExists(ip: string): Promise<boolean> {
  const qdrant = getClient();
  if (!qdrant) return false;

  try {
    await ensureCollection();

    const result = await qdrant.scroll(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'ip',
            match: { value: ip },
          },
        ],
      },
      limit: 1,
    });

    return result.points.length > 0;
  } catch (error) {
    console.error('Error checking IP existence:', error);
    return false;
  }
}

/**
 * Add a new waitlist entry
 */
export async function addEntry(entry: WaitlistEntry): Promise<boolean> {
  const qdrant = getClient();
  if (!qdrant) return false;

  try {
    await ensureCollection();

    // Use IP hash as point ID to ensure uniqueness
    const pointId = hashToNumber(entry.ip);

    await qdrant.upsert(COLLECTION_NAME, {
      points: [
        {
          id: pointId,
          vector: [0.1, 0.1, 0.1, 0.1], // Dummy vector - we're not doing similarity search
          payload: {
            email: entry.email,
            ip: entry.ip,
            joinedAt: entry.joinedAt,
            source: entry.source,
            status: entry.status,
            initialMessage: entry.initialMessage,
            reluminantMessage: entry.reluminantMessage,
            humanResponse: entry.humanResponse,
            notes: entry.notes,
          },
        },
      ],
    });

    console.log(`Waitlist entry added for: ${entry.email}`);
    return true;
  } catch (error) {
    console.error('Failed to add waitlist entry:', error);
    return false;
  }
}

/**
 * Get all waitlist entries
 */
export async function getAllEntries(): Promise<WaitlistEntry[]> {
  const qdrant = getClient();
  if (!qdrant) return [];

  try {
    await ensureCollection();

    const result = await qdrant.scroll(COLLECTION_NAME, {
      limit: 1000,
      with_payload: true,
    });

    return result.points.map((p) => (p.payload || {}) as unknown as WaitlistEntry);
  } catch (error) {
    console.error('Failed to get waitlist entries:', error);
    return [];
  }
}

/**
 * Get waitlist count
 */
export async function getCount(): Promise<number> {
  const qdrant = getClient();
  if (!qdrant) return 0;

  try {
    await ensureCollection();

    const info = await qdrant.getCollection(COLLECTION_NAME);
    return info.points_count || 0;
  } catch (error) {
    console.error('Failed to get waitlist count:', error);
    return 0;
  }
}

/**
 * Check if Qdrant is configured and available
 */
export function isConfigured(): boolean {
  return !!(process.env.QDRANT_URL && process.env.QDRANT_API_KEY);
}
