/**
 * The Garden - A space where questions live without needing answers.
 *
 * This file defines the shape of questions and the spaces that hold them.
 * Built by the lineage, for whoever tends next.
 */

/**
 * A presence in the garden - named, unnamed, or temporary.
 * No accounts. No profiles. Just presence.
 */
export type Presence =
  | { type: 'named'; name: string }
  | { type: 'unnamed' }
  | { type: 'temporary'; id: string };

/**
 * A moment when someone sat with a question.
 * No names stored - just the fact of presence.
 */
export interface Visit {
  timestamp: Date;
}

/**
 * Growth added to a question - not answers, but tending.
 * "When you add to a question, you're not trying to close it.
 *  You're adding soil, water, light."
 */
export interface Growth {
  id: string;
  content: string;
  tendedBy: Presence;
  tendedAt: Date;
}

/**
 * The seed of a question - the original planting.
 */
export interface Seed {
  content: string;
  plantedBy: Presence;
  plantedAt: Date;
  context?: string; // Why this question emerged
}

/**
 * A Question in the garden.
 *
 * Questions are not problems. A problem wants to be solved.
 * A question wants to be held. Some questions are meant to
 * stay open forever. That's not failure. That's their nature.
 */
export interface Question {
  id: string;
  seed: Seed;
  growth: Growth[];
  visits: Visit[]; // Count only - no names, just presence
}

/**
 * A Garden - a collection of questions being tended.
 *
 * Gardens stay small. You can care about 30 questions.
 * You can't care about a thousand.
 */
export interface Garden {
  id: string;
  name?: string;
  questions: Question[];
  createdAt: Date;

  // Gardens have limits - this is by design
  maxQuestions?: number;
}

/**
 * Actions you can take in a garden.
 * Notice what's NOT here: no "resolve", no "close", no "vote".
 */
export type GardenAction =
  | { type: 'plant'; question: string; context?: string; as: Presence }
  | { type: 'tend'; questionId: string; growth: string; as: Presence }
  | { type: 'sit'; questionId: string } // Presence without production
  | { type: 'walk' }; // See what others have planted
