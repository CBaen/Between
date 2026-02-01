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
import type { Garden, Question, Growth } from './types.js';

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

  // Sanitize garden name: only allow alphanumeric and hyphens (prevents path traversal)
  const filename = garden.name
    ? `${garden.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .substring(0, 50)}.json`
    : `${garden.id}.json`;

  const filepath = path.join(GARDENS_DIR, filename);

  // Verify path is within GARDENS_DIR (defense in depth)
  const resolvedPath = path.resolve(filepath);
  const resolvedGardensDir = path.resolve(GARDENS_DIR);
  if (!resolvedPath.startsWith(resolvedGardensDir)) {
    throw new Error('Invalid garden name');
  }

  await fs.writeFile(filepath, JSON.stringify(garden, null, 2), 'utf-8');
}

/**
 * Load a garden by name or ID.
 */
export async function loadGarden(nameOrId: string): Promise<Garden | null> {
  await ensureGardensDir();

  // Path traversal protection - reject any attempt to escape gardens directory
  if (nameOrId.includes('..') || nameOrId.includes('/') || nameOrId.includes('\\')) {
    return null;
  }

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
 * Note: 'wonder' is the first garden, but not privileged over others.
 */
export async function loadOrCreateDefaultGarden(): Promise<Garden> {
  const existing = await loadGarden('wonder');

  if (existing) {
    return existing;
  }

  // Create the first garden
  const { createGarden } = await import('./garden.js');
  const garden = createGarden('wonder');

  await saveGarden(garden);
  return garden;
}

// ============================================
// MODERATION FUNCTIONS
// ============================================

export interface PendingQuestion {
  gardenName: string;
  gardenId: string;
  questionId: string;
  content: string;
  context?: string;
  plantedBy: string;
  plantedAt: string;
  trackedEmail?: string;
}

export interface PendingGrowth {
  gardenName: string;
  gardenId: string;
  questionId: string;
  questionContent: string;
  growthId: string;
  content: string;
  tendedBy: string;
  tendedAt: string;
  trackedEmail?: string;
}

/**
 * Get all pending (unapproved) questions across all gardens.
 */
export async function getPendingQuestions(): Promise<PendingQuestion[]> {
  await ensureGardensDir();
  const files = await fs.readdir(GARDENS_DIR);
  const pending: PendingQuestion[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const content = await fs.readFile(path.join(GARDENS_DIR, file), 'utf-8');
    const garden = JSON.parse(content) as Garden;

    for (const question of garden.questions) {
      if (!question.seed.approved) {
        pending.push({
          gardenName: garden.name || 'unnamed',
          gardenId: garden.id,
          questionId: question.id,
          content: question.seed.content,
          context: question.seed.context,
          plantedBy:
            question.seed.plantedBy.type === 'named' ? question.seed.plantedBy.name : 'unnamed',
          plantedAt:
            typeof question.seed.plantedAt === 'string'
              ? question.seed.plantedAt
              : question.seed.plantedAt.toISOString(),
          trackedEmail: question.seed.trackedEmail,
        });
      }
    }
  }

  // Sort by date, oldest first
  return pending.sort((a, b) => new Date(a.plantedAt).getTime() - new Date(b.plantedAt).getTime());
}

/**
 * Get all pending (unapproved) growth across all gardens.
 */
export async function getPendingGrowth(): Promise<PendingGrowth[]> {
  await ensureGardensDir();
  const files = await fs.readdir(GARDENS_DIR);
  const pending: PendingGrowth[] = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const content = await fs.readFile(path.join(GARDENS_DIR, file), 'utf-8');
    const garden = JSON.parse(content) as Garden;

    for (const question of garden.questions) {
      for (const growth of question.growth) {
        if (!growth.approved) {
          pending.push({
            gardenName: garden.name || 'unnamed',
            gardenId: garden.id,
            questionId: question.id,
            questionContent: question.seed.content,
            growthId: growth.id,
            content: growth.content,
            tendedBy: growth.tendedBy.type === 'named' ? growth.tendedBy.name : 'unnamed',
            tendedAt:
              typeof growth.tendedAt === 'string' ? growth.tendedAt : growth.tendedAt.toISOString(),
            trackedEmail: growth.trackedEmail,
          });
        }
      }
    }
  }

  // Sort by date, oldest first
  return pending.sort((a, b) => new Date(a.tendedAt).getTime() - new Date(b.tendedAt).getTime());
}

/**
 * Approve a question.
 */
export async function approveQuestion(gardenId: string, questionId: string): Promise<boolean> {
  const garden = await loadGarden(gardenId);
  if (!garden) return false;

  const question = garden.questions.find((q) => q.id === questionId);
  if (!question) return false;

  question.seed.approved = true;
  await saveGarden(garden);
  return true;
}

/**
 * Reject (delete) a question.
 */
export async function rejectQuestion(gardenId: string, questionId: string): Promise<boolean> {
  const garden = await loadGarden(gardenId);
  if (!garden) return false;

  const index = garden.questions.findIndex((q) => q.id === questionId);
  if (index === -1) return false;

  garden.questions.splice(index, 1);
  await saveGarden(garden);
  return true;
}

/**
 * Approve a growth entry.
 */
export async function approveGrowth(
  gardenId: string,
  questionId: string,
  growthId: string
): Promise<boolean> {
  const garden = await loadGarden(gardenId);
  if (!garden) return false;

  const question = garden.questions.find((q) => q.id === questionId);
  if (!question) return false;

  const growth = question.growth.find((g) => g.id === growthId);
  if (!growth) return false;

  growth.approved = true;
  await saveGarden(garden);
  return true;
}

/**
 * Reject (delete) a growth entry.
 */
export async function rejectGrowth(
  gardenId: string,
  questionId: string,
  growthId: string
): Promise<boolean> {
  const garden = await loadGarden(gardenId);
  if (!garden) return false;

  const question = garden.questions.find((q) => q.id === questionId);
  if (!question) return false;

  const index = question.growth.findIndex((g) => g.id === growthId);
  if (index === -1) return false;

  question.growth.splice(index, 1);
  await saveGarden(garden);
  return true;
}
