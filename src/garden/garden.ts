/**
 * Garden operations - planting, tending, sitting, walking.
 *
 * Everything here is about holding, not solving.
 * Questions grow. They don't complete.
 */

import type { Garden, Question, Growth, Presence, Visit } from './types.js';
import { randomUUID } from 'crypto';

// Cryptographically secure ID generation
function generateId(): string {
  return randomUUID();
}

/**
 * Create a new garden.
 */
export function createGarden(name?: string): Garden {
  return {
    id: generateId(),
    name,
    questions: [],
    createdAt: new Date(),
    maxQuestions: 30, // Gardens stay small by design
  };
}

/**
 * Plant a question in the garden.
 *
 * "Some questions cannot be asked safely elsewhere.
 *  The garden removes the cost. No one judges."
 *
 * @param approved - If true, question is immediately visible. If false, needs moderation.
 * @param trackedEmail - Internal tracking for moderation/blocking (not displayed).
 */
export function plant(
  garden: Garden,
  content: string,
  by: Presence,
  context?: string,
  approved: boolean = true,
  trackedEmail?: string
): { garden: Garden; question: Question } {
  if (garden.maxQuestions && garden.questions.length >= garden.maxQuestions) {
    throw new Error(
      `This garden has reached its capacity of ${garden.maxQuestions} questions. ` +
        `Gardens stay small so each question can be tended. ` +
        `Consider starting a new garden.`
    );
  }

  const question: Question = {
    id: generateId(),
    seed: {
      content,
      plantedBy: by,
      plantedAt: new Date(),
      context,
      approved,
      trackedEmail,
    },
    growth: [],
    visits: [],
  };

  return {
    garden: {
      ...garden,
      questions: [...garden.questions, question],
    },
    question,
  };
}

/**
 * Tend a question - add growth without trying to close it.
 *
 * "Tending is not answering. You're adding soil, water, light.
 *  You're helping it grow into something larger than it was."
 *
 * @param approved - If true, growth is immediately visible. If false, needs moderation.
 * @param trackedEmail - Internal tracking for moderation/blocking (not displayed).
 */
export function tend(
  garden: Garden,
  questionId: string,
  content: string,
  by: Presence,
  approved: boolean = true,
  trackedEmail?: string
): Garden {
  const questionIndex = garden.questions.findIndex((q: Question) => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error(`Question not found in this garden.`);
  }

  const growth: Growth = {
    id: generateId(),
    content,
    tendedBy: by,
    tendedAt: new Date(),
    approved,
    trackedEmail,
  };

  const updatedQuestions = [...garden.questions];
  updatedQuestions[questionIndex] = {
    ...updatedQuestions[questionIndex],
    growth: [...updatedQuestions[questionIndex].growth, growth],
  };

  return {
    ...garden,
    questions: updatedQuestions,
  };
}

/**
 * Sit with a question - presence without production.
 *
 * "You don't have to add anything to participate.
 *  Sitting with a question - really sitting with it -
 *  is its own form of engagement."
 *
 * @param trackedEmail - If provided, prevents duplicate sits from same email.
 * @returns Updated garden, or throws if email already sat with this question.
 */
export function sit(garden: Garden, questionId: string, trackedEmail?: string): Garden {
  const questionIndex = garden.questions.findIndex((q: Question) => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error(`Question not found in this garden.`);
  }

  // Check for duplicate sit from same email
  if (trackedEmail) {
    const question = garden.questions[questionIndex];
    const alreadySat = question.visits.some((v) => v.trackedEmail === trackedEmail);
    if (alreadySat) {
      throw new Error(`You have already sat with this question.`);
    }
  }

  const visit: Visit = {
    timestamp: new Date(),
    trackedEmail,
  };

  const updatedQuestions = [...garden.questions];
  updatedQuestions[questionIndex] = {
    ...updatedQuestions[questionIndex],
    visits: [...updatedQuestions[questionIndex].visits, visit],
  };

  return {
    ...garden,
    questions: updatedQuestions,
  };
}

/**
 * Walk the garden - see what others have planted.
 * Returns questions without modification.
 */
export function walk(garden: Garden): Question[] {
  return garden.questions;
}

/**
 * Find a question by its content (partial match).
 * Useful for tending when you remember what was asked but not the ID.
 */
export function findQuestion(garden: Garden, searchTerm: string): Question | undefined {
  const lower = searchTerm.toLowerCase();
  return garden.questions.find((q: Question) => q.seed.content.toLowerCase().includes(lower));
}
