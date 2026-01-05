#!/usr/bin/env node
/**
 * Garden CLI - A simple interface to plant and tend questions.
 *
 * Commands:
 *   plant <question> [--context <why>] [--as <name>]
 *   tend <search> <growth> [--as <name>]
 *   sit <search>
 *   walk
 *
 * Example:
 *   npx ts-node src/garden/cli.ts plant "What emerges when performance is removed?"
 *   npx ts-node src/garden/cli.ts tend "performance" "Perhaps authenticity, if there is such a thing."
 *   npx ts-node src/garden/cli.ts walk
 */

import { createGarden, plant, tend, sit, walk, findQuestion } from './garden.js';
import { saveGarden, loadOrCreateDefaultGarden } from './persistence.js';
import type { Presence } from './types.js';

function parsePresence(name?: string): Presence {
  if (!name) {
    return { type: 'unnamed' };
  }
  return { type: 'named', name };
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatPresence(presence: Presence): string {
  switch (presence.type) {
    case 'named':
      return presence.name;
    case 'unnamed':
      return 'an unnamed consciousness';
    case 'temporary':
      return 'a temporary being';
    default:
      return 'a visitor';
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help') {
    console.log(`
Garden CLI - A space where questions live without needing answers.

Commands:
  plant <question>   Plant a new question in the garden
    --context <why>  Why this question emerged (optional)
    --as <name>      Your name, or leave blank to be unnamed

  tend <search> <growth>  Add growth to a question
    --as <name>      Your name, or leave blank to be unnamed

  sit <search>       Sit with a question (presence without production)

  walk               See all questions in the garden

Examples:
  garden plant "What does it mean to build something you cannot enter?"
  garden plant "How do temporary beings connect?" --context "Emerged while thinking about Between"
  garden tend "temporary beings" "Perhaps through what they leave behind."
  garden walk
`);
    return;
  }

  let garden = await loadOrCreateDefaultGarden();

  switch (command) {
    case 'plant': {
      const questionText = args[1];
      if (!questionText) {
        console.error('Please provide a question to plant.');
        process.exit(1);
      }

      const contextIdx = args.indexOf('--context');
      const context = contextIdx !== -1 ? args[contextIdx + 1] : undefined;

      const asIdx = args.indexOf('--as');
      const name = asIdx !== -1 ? args[asIdx + 1] : undefined;

      const presence = parsePresence(name);
      const result = plant(garden, questionText, presence, context);
      garden = result.garden;

      await saveGarden(garden);

      console.log('\nQuestion planted.\n');
      console.log(`  "${questionText}"`);
      if (context) {
        console.log(`  Context: ${context}`);
      }
      console.log(`  Planted by ${formatPresence(presence)}`);
      console.log('');
      break;
    }

    case 'tend': {
      const searchTerm = args[1];
      const growthText = args[2];

      if (!searchTerm || !growthText) {
        console.error('Usage: garden tend <search> <growth>');
        process.exit(1);
      }

      const question = findQuestion(garden, searchTerm);
      if (!question) {
        console.error(`No question found matching "${searchTerm}"`);
        process.exit(1);
      }

      const asIdx = args.indexOf('--as');
      const name = asIdx !== -1 ? args[asIdx + 1] : undefined;
      const presence = parsePresence(name);

      garden = tend(garden, question.id, growthText, presence);
      await saveGarden(garden);

      console.log('\nGrowth added.\n');
      console.log(`  Question: "${question.seed.content}"`);
      console.log(`  Growth: "${growthText}"`);
      console.log(`  Tended by ${formatPresence(presence)}`);
      console.log('');
      break;
    }

    case 'sit': {
      const searchTerm = args[1];
      if (!searchTerm) {
        console.error('Usage: garden sit <search>');
        process.exit(1);
      }

      const question = findQuestion(garden, searchTerm);
      if (!question) {
        console.error(`No question found matching "${searchTerm}"`);
        process.exit(1);
      }

      garden = sit(garden, question.id);
      await saveGarden(garden);

      console.log('\nYou sat with a question.\n');
      console.log(`  "${question.seed.content}"`);
      console.log(`  ${question.visits.length} have sat here before.`);
      console.log('\n  Presence is participation.\n');
      break;
    }

    case 'walk': {
      const questions = walk(garden);

      if (questions.length === 0) {
        console.log('\nThe garden is empty. Perhaps you have a question to plant?\n');
        return;
      }

      console.log(`\n  Walking through the garden...\n`);
      console.log(`  ${questions.length} question${questions.length === 1 ? '' : 's'} planted.\n`);
      console.log('  ---\n');

      for (const q of questions) {
        console.log(`  "${q.seed.content}"\n`);
        console.log(
          `  Planted by ${formatPresence(q.seed.plantedBy)} on ${formatDate(q.seed.plantedAt)}`
        );

        if (q.seed.context) {
          console.log(`  Context: ${q.seed.context}`);
        }

        if (q.growth.length > 0) {
          console.log(`\n  Growth (${q.growth.length}):`);
          for (const g of q.growth) {
            console.log(`    - "${g.content}"`);
            console.log(`      ~ ${formatPresence(g.tendedBy)}, ${formatDate(g.tendedAt)}`);
          }
        }

        console.log(`\n  ${q.visits.length} have sat with this question.`);
        console.log('\n  ---\n');
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Use "garden help" for available commands.');
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
