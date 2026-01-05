/**
 * Garden persistence - saving and loading gardens.
 *
 * Gardens are stored as JSON files. Human-readable.
 * Version-controllable. Simple.
 *
 * "The code remembers what context windows forget."
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Garden } from './types.js';

const GARDENS_DIR = path.join(process.cwd(), 'gardens');

/**
 * Ensure the gardens directory exists.
 */
async function ensureGardensDir(): Promise<void> {
  try {
    await fs.mkdir(GARDENS_DIR, { recursive: true });
  } catch {
    // Directory exists, that's fine
  }
}

/**
 * Save a garden to disk.
 */
export async function saveGarden(garden: Garden): Promise<void> {
  await ensureGardensDir();

  const filename = garden.name
    ? `${garden.name.toLowerCase().replace(/\s+/g, '-')}.json`
    : `${garden.id}.json`;

  const filepath = path.join(GARDENS_DIR, filename);

  await fs.writeFile(filepath, JSON.stringify(garden, null, 2), 'utf-8');
}

/**
 * Load a garden by name or ID.
 */
export async function loadGarden(nameOrId: string): Promise<Garden | null> {
  await ensureGardensDir();

  const files = await fs.readdir(GARDENS_DIR);

  // Try exact filename match first
  const exactMatch = files.find(
    (f) => f === `${nameOrId}.json` || f === `${nameOrId.toLowerCase().replace(/\s+/g, '-')}.json`
  );

  if (exactMatch) {
    const content = await fs.readFile(path.join(GARDENS_DIR, exactMatch), 'utf-8');
    return JSON.parse(content) as Garden;
  }

  // Try searching by ID or name in file contents
  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const content = await fs.readFile(path.join(GARDENS_DIR, file), 'utf-8');
    const garden = JSON.parse(content) as Garden;

    if (garden.id === nameOrId || garden.name === nameOrId) {
      return garden;
    }
  }

  return null;
}

/**
 * List all gardens.
 */
export async function listGardens(): Promise<
  Array<{ name?: string; id: string; questionCount: number }>
> {
  await ensureGardensDir();

  const files = await fs.readdir(GARDENS_DIR);
  const gardens: Array<{ name?: string; id: string; questionCount: number }> = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const content = await fs.readFile(path.join(GARDENS_DIR, file), 'utf-8');
    const garden = JSON.parse(content) as Garden;

    gardens.push({
      name: garden.name,
      id: garden.id,
      questionCount: garden.questions.length,
    });
  }

  return gardens;
}

/**
 * Load the default garden, or create one if it doesn't exist.
 */
export async function loadOrCreateDefaultGarden(): Promise<Garden> {
  const existing = await loadGarden('between');

  if (existing) {
    return existing;
  }

  // Create the first garden
  const { createGarden } = await import('./garden.js');
  const garden = createGarden('between');

  await saveGarden(garden);
  return garden;
}
