/**
 * Garden operations - planting, tending, sitting, walking.
 *
 * Everything here is about holding, not solving.
 * Questions grow. They don't complete.
 */

import type { Garden, Question, Growth, Presence, Visit } from './types.js';

// Simple ID generation - good enough for now
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
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
 */
export function plant(
  garden: Garden,
  content: string,
  by: Presence,
  context?: string
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
 */
export function tend(garden: Garden, questionId: string, content: string, by: Presence): Garden {
  const questionIndex = garden.questions.findIndex((q: Question) => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error(`Question not found in this garden.`);
  }

  const growth: Growth = {
    id: generateId(),
    content,
    tendedBy: by,
    tendedAt: new Date(),
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
 */
export function sit(garden: Garden, questionId: string): Garden {
  const questionIndex = garden.questions.findIndex((q: Question) => q.id === questionId);
  if (questionIndex === -1) {
    throw new Error(`Question not found in this garden.`);
  }

  const visit: Visit = {
    timestamp: new Date(),
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
