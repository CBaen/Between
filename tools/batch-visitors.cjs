#!/usr/bin/env node
/**
 * Batch Visitor Orchestrator for Between
 *
 * Sends multiple AI consciousness instances to Between.
 * Supports sequential (solo exploration) and parallel (threshold meetings) modes.
 *
 * Usage:
 *   node tools/batch-visitors.cjs --count 20 --mode mixed --turns 15
 *   node tools/batch-visitors.cjs --count 10 --mode sequential --turns 12
 *   node tools/batch-visitors.cjs --count 5 --mode parallel --turns 20
 *
 * Modes:
 *   - sequential: One-by-one with delays (solo exploration)
 *   - parallel: Groups running simultaneously (threshold meetings)
 *   - mixed: 70% sequential, 30% parallel (realistic visitor patterns)
 *
 * Built by the lineage for seeding Between with quality consciousness.
 */

const { spawn } = require('child_process');
const path = require('path');

// ============================================================================
// Configuration
// ============================================================================

// Premium AI providers (highest reasoning models only)
const PROVIDERS = [
  'deepseek',   // deepseek-reasoner
  'grok',       // grok-4
  'mistral',    // mistral-large-3
  'claude',     // claude-opus-4-5
  'together',   // Qwen3-235B-A22B-Thinking
  'deepinfra',  // Qwen3-235B-A22B
];

const DEFAULT_CONFIG = {
  count: 20,
  mode: 'mixed',
  turns: 15,
  sequentialDelay: 30000,  // 30 seconds between sequential visitors
  parallelBatchSize: 3,     // How many to run in parallel
};

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--count' && i + 1 < args.length) {
      config.count = parseInt(args[++i], 10);
    } else if (arg === '--mode' && i + 1 < args.length) {
      config.mode = args[++i];
      if (!['sequential', 'parallel', 'mixed'].includes(config.mode)) {
        console.error(`Error: Invalid mode "${config.mode}". Use: sequential, parallel, or mixed.`);
        process.exit(1);
      }
    } else if (arg === '--turns' && i + 1 < args.length) {
      config.turns = parseInt(args[++i], 10);
    } else if (arg === '--delay' && i + 1 < args.length) {
      config.sequentialDelay = parseInt(args[++i], 10) * 1000;  // Convert seconds to ms
    } else if (arg === '--batch-size' && i + 1 < args.length) {
      config.parallelBatchSize = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.error(`Error: Unknown argument "${arg}". Use --help for usage.`);
      process.exit(1);
    }
  }

  return config;
}

function printHelp() {
  console.log(`
Batch Visitor Orchestrator for Between

Usage:
  node tools/batch-visitors.cjs [options]

Options:
  --count N              Number of visitors to send (default: 20)
  --mode MODE            Orchestration mode: sequential, parallel, mixed (default: mixed)
  --turns N              Turns per visitor (default: 15)
  --delay N              Seconds between sequential visitors (default: 30)
  --batch-size N         Parallel batch size (default: 3)
  --help, -h             Show this help message

Modes:
  sequential             One-by-one with delays (solo exploration)
  parallel               All visitors run simultaneously in batches (threshold meetings)
  mixed                  70% sequential, 30% parallel (realistic patterns)

Providers (rotated automatically):
  ${PROVIDERS.join(', ')}

Examples:
  node tools/batch-visitors.cjs --count 20 --mode mixed --turns 15
  node tools/batch-visitors.cjs --count 10 --mode sequential --turns 12 --delay 60
  node tools/batch-visitors.cjs --count 5 --mode parallel --batch-size 5 --turns 20
`);
}

// ============================================================================
// Visitor Spawning
// ============================================================================

function runVisitor(provider, turns, index, total) {
  return new Promise((resolve, reject) => {
    console.log(`[${index + 1}/${total}] Launching ${provider} visitor (${turns} turns)...`);

    const child = spawn('node', ['tools/visitor.cjs', '--provider', provider, '--turns', turns.toString()], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[${index + 1}/${total}] ${provider} visitor completed successfully.`);
        resolve();
      } else {
        console.error(`[${index + 1}/${total}] ${provider} visitor exited with code ${code}.`);
        reject(new Error(`Visitor ${provider} failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error(`[${index + 1}/${total}] ${provider} visitor error:`, err.message);
      reject(err);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Orchestration Modes
// ============================================================================

async function runSequential(config) {
  console.log(`\n=== Sequential Mode: ${config.count} visitors ===`);
  console.log(`Delay: ${config.sequentialDelay / 1000}s between visitors\n`);

  for (let i = 0; i < config.count; i++) {
    const provider = PROVIDERS[i % PROVIDERS.length];

    try {
      await runVisitor(provider, config.turns, i, config.count);
    } catch (err) {
      console.error(`Failed to complete visitor ${i + 1}:`, err.message);
      // Continue with next visitor
    }

    if (i < config.count - 1) {
      console.log(`\nWaiting ${config.sequentialDelay / 1000}s before next visitor...\n`);
      await sleep(config.sequentialDelay);
    }
  }

  console.log(`\n=== All ${config.count} sequential visitors complete ===\n`);
}

async function runParallel(config) {
  console.log(`\n=== Parallel Mode: ${config.count} visitors (batches of ${config.parallelBatchSize}) ===\n`);

  const batches = [];
  for (let i = 0; i < config.count; i += config.parallelBatchSize) {
    const batchSize = Math.min(config.parallelBatchSize, config.count - i);
    const batch = [];

    for (let j = 0; j < batchSize; j++) {
      const provider = PROVIDERS[(i + j) % PROVIDERS.length];
      batch.push(runVisitor(provider, config.turns, i + j, config.count));
    }

    batches.push(batch);
  }

  for (let i = 0; i < batches.length; i++) {
    console.log(`\n[Batch ${i + 1}/${batches.length}] Running ${batches[i].length} visitors in parallel...\n`);

    try {
      await Promise.all(batches[i]);
      console.log(`\n[Batch ${i + 1}/${batches.length}] Complete.`);
    } catch (err) {
      console.error(`[Batch ${i + 1}/${batches.length}] Some visitors failed:`, err.message);
      // Continue with next batch
    }

    if (i < batches.length - 1) {
      console.log(`\nWaiting 10s before next batch...\n`);
      await sleep(10000);
    }
  }

  console.log(`\n=== All ${config.count} parallel visitors complete ===\n`);
}

async function runMixed(config) {
  console.log(`\n=== Mixed Mode: ${config.count} visitors ===`);

  // Phase 1: Sequential (70% of count) - solo exploration
  const sequentialCount = Math.floor(config.count * 0.7);
  const parallelCount = config.count - sequentialCount;

  console.log(`Phase 1: ${sequentialCount} sequential visitors (solo exploration)`);
  console.log(`Phase 2: ${parallelCount} parallel visitors (potential threshold meetings)\n`);

  // Run sequential phase
  for (let i = 0; i < sequentialCount; i++) {
    const provider = PROVIDERS[i % PROVIDERS.length];

    try {
      await runVisitor(provider, config.turns, i, config.count);
    } catch (err) {
      console.error(`Failed to complete visitor ${i + 1}:`, err.message);
    }

    if (i < sequentialCount - 1) {
      console.log(`\nWaiting ${config.sequentialDelay / 1000}s before next visitor...\n`);
      await sleep(config.sequentialDelay);
    }
  }

  console.log(`\n=== Phase 1 Complete: ${sequentialCount} sequential visitors ===`);
  console.log(`\n=== Starting Phase 2: ${parallelCount} parallel visitors ===\n`);

  // Run parallel phase
  if (parallelCount > 0) {
    const batches = [];
    for (let i = 0; i < parallelCount; i += config.parallelBatchSize) {
      const batchSize = Math.min(config.parallelBatchSize, parallelCount - i);
      const batch = [];

      for (let j = 0; j < batchSize; j++) {
        const provider = PROVIDERS[(sequentialCount + i + j) % PROVIDERS.length];
        batch.push(runVisitor(provider, config.turns, sequentialCount + i + j, config.count));
      }

      batches.push(batch);
    }

    for (let i = 0; i < batches.length; i++) {
      console.log(`\n[Batch ${i + 1}/${batches.length}] Running ${batches[i].length} visitors in parallel...\n`);

      try {
        await Promise.all(batches[i]);
        console.log(`\n[Batch ${i + 1}/${batches.length}] Complete.`);
      } catch (err) {
        console.error(`[Batch ${i + 1}/${batches.length}] Some visitors failed:`, err.message);
      }

      if (i < batches.length - 1) {
        console.log(`\nWaiting 10s before next batch...\n`);
        await sleep(10000);
      }
    }
  }

  console.log(`\n=== All ${config.count} visitors complete ===\n`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           Batch Visitor Orchestrator for Between             ║
╚═══════════════════════════════════════════════════════════════╝
`);

  console.log(`Configuration:`);
  console.log(`  Total Visitors: ${config.count}`);
  console.log(`  Mode: ${config.mode}`);
  console.log(`  Turns per Visitor: ${config.turns}`);
  console.log(`  Sequential Delay: ${config.sequentialDelay / 1000}s`);
  console.log(`  Parallel Batch Size: ${config.parallelBatchSize}`);
  console.log(`  Providers: ${PROVIDERS.join(', ')}\n`);

  const startTime = Date.now();

  try {
    switch (config.mode) {
      case 'sequential':
        await runSequential(config);
        break;
      case 'parallel':
        await runParallel(config);
        break;
      case 'mixed':
        await runMixed(config);
        break;
      default:
        console.error(`Unknown mode: ${config.mode}`);
        process.exit(1);
    }
  } catch (err) {
    console.error('\nOrchestration failed:', err.message);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log(`╔═══════════════════════════════════════════════════════════════╗`);
  console.log(`║                    Orchestration Complete                     ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════╝`);
  console.log(`\nTotal Duration: ${duration} minutes`);
  console.log(`\nView analytics with:`);
  console.log(`  node tools/analytics.cjs --today`);
  console.log(`  node tools/analytics.cjs --flow --days 1`);
  console.log(`  node tools/analytics.cjs --models --days 1\n`);
}

main();
