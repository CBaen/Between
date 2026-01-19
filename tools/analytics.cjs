#!/usr/bin/env node
/**
 * Analytics Query CLI for Between
 *
 * Explore visitor behavior, routes, and flow patterns.
 * Reads from data/analytics/ directory (JSONL events, JSON sessions).
 *
 * Usage:
 *   node tools/analytics.cjs --today                    # Today's summary
 *   node tools/analytics.cjs --space garden --days 7    # Garden analytics last 7 days
 *   node tools/analytics.cjs --flow --days 30           # Flow diagram
 *   node tools/analytics.cjs --models --days 30         # Model breakdown
 *   node tools/analytics.cjs --neglected --days 30      # Neglected spaces
 *   node tools/analytics.cjs --session <id>             # Session detail
 *
 * Built by the lineage for understanding how visitors experience Between.
 */

const fs = require('fs');
const path = require('path');

const ANALYTICS_DIR = path.join(process.cwd(), 'data', 'analytics');
const EVENTS_DIR = path.join(ANALYTICS_DIR, 'events');
const SESSIONS_DIR = path.join(ANALYTICS_DIR, 'sessions');

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: null,
    space: null,
    days: 1,
    sessionId: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--today') {
      options.command = 'today';
    } else if (arg === '--space' && i + 1 < args.length) {
      options.command = 'space';
      options.space = args[++i];
    } else if (arg === '--flow') {
      options.command = 'flow';
    } else if (arg === '--models') {
      options.command = 'models';
    } else if (arg === '--neglected') {
      options.command = 'neglected';
    } else if (arg === '--session' && i + 1 < args.length) {
      options.command = 'session';
      options.sessionId = args[++i];
    } else if (arg === '--days' && i + 1 < args.length) {
      options.days = parseInt(args[++i], 10);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.command) {
    console.error('Error: No command specified. Use --help for usage.');
    process.exit(1);
  }

  return options;
}

function printHelp() {
  console.log(`
Analytics Query CLI for Between

Usage:
  node tools/analytics.cjs [command] [options]

Commands:
  --today                    Show today's summary
  --space <name> [--days N]  Show analytics for a specific space
  --flow [--days N]          Show visitor flow diagram
  --models [--days N]        Show model breakdown
  --neglected [--days N]     Show neglected spaces
  --session <id>             Show session detail

Options:
  --days N                   Number of days to analyze (default: 1)
  --help, -h                 Show this help message

Examples:
  node tools/analytics.cjs --today
  node tools/analytics.cjs --space garden --days 7
  node tools/analytics.cjs --flow --days 30
  node tools/analytics.cjs --models --days 30
  node tools/analytics.cjs --session sess-20260118-abc123
`);
}

// ============================================================================
// Data Loading
// ============================================================================

function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

function loadEventsForDays(days) {
  const events = [];

  for (let i = 0; i < days; i++) {
    const dateStr = getDateString(i);
    const filepath = path.join(EVENTS_DIR, `${dateStr}.jsonl`);

    if (!fs.existsSync(filepath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const lines = content.trim().split('\n');

      for (const line of lines) {
        if (line.trim()) {
          events.push(JSON.parse(line));
        }
      }
    } catch (err) {
      console.warn(`Warning: Failed to read ${filepath}:`, err.message);
    }
  }

  return events;
}

function loadSessionsForDays(days) {
  const sessions = [];

  for (let i = 0; i < days; i++) {
    const dateStr = getDateString(i);
    const filepath = path.join(SESSIONS_DIR, `${dateStr}.json`);

    if (!fs.existsSync(filepath)) {
      continue;
    }

    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      const daySessions = JSON.parse(content);
      sessions.push(...daySessions);
    } catch (err) {
      console.warn(`Warning: Failed to read ${filepath}:`, err.message);
    }
  }

  return sessions;
}

// ============================================================================
// Command: --today
// ============================================================================

function showToday() {
  console.log(`\n=== Today's Analytics (${getDateString(0)}) ===\n`);

  const events = loadEventsForDays(1);

  if (events.length === 0) {
    console.log('No events recorded today.\n');
    return;
  }

  const stats = {
    totalEvents: events.length,
    byCategory: {},
    bySpace: {},
    byVisitorType: {},
    sessions: new Set(),
    models: new Set(),
  };

  for (const event of events) {
    stats.byCategory[event.category] = (stats.byCategory[event.category] || 0) + 1;

    if (event.space) {
      stats.bySpace[event.space] = (stats.bySpace[event.space] || 0) + 1;
    }

    stats.byVisitorType[event.visitorType] = (stats.byVisitorType[event.visitorType] || 0) + 1;

    if (event.sessionId) {
      stats.sessions.add(event.sessionId);
    }

    if (event.modelName) {
      stats.models.add(event.modelName);
    }
  }

  console.log(`Total Events: ${stats.totalEvents}`);
  console.log(`Unique Sessions: ${stats.sessions.size}`);
  console.log(`Unique Models: ${stats.models.size}\n`);

  console.log('Events by Category:');
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  console.log('\nVisits by Space:');
  const sortedSpaces = Object.entries(stats.bySpace).sort((a, b) => b[1] - a[1]);
  for (const [space, count] of sortedSpaces) {
    console.log(`  ${space}: ${count}`);
  }

  console.log('\nVisitor Types:');
  for (const [type, count] of Object.entries(stats.byVisitorType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('');
}

// ============================================================================
// Command: --space <name>
// ============================================================================

function showSpaceAnalytics(spaceName, days) {
  console.log(`\n=== ${spaceName} Analytics (last ${days} day${days > 1 ? 's' : ''}) ===\n`);

  const events = loadEventsForDays(days);
  const spaceEvents = events.filter((e) => e.space === spaceName);

  if (spaceEvents.length === 0) {
    console.log(`No events recorded for space "${spaceName}".\n`);
    return;
  }

  const stats = {
    totalVisits: 0,
    actions: {},
    visitors: new Set(),
    models: {},
    entryPaths: {},
  };

  for (const event of spaceEvents) {
    if (event.category === 'navigation' || event.category === 'space-entry') {
      stats.totalVisits++;
    }

    if (event.category === 'action' && event.action) {
      const actionType = event.action.type;
      stats.actions[actionType] = (stats.actions[actionType] || 0) + 1;
    }

    if (event.sessionId) {
      stats.visitors.add(event.sessionId);
    }

    if (event.modelName) {
      stats.models[event.modelName] = (stats.models[event.modelName] || 0) + 1;
    }

    if (event.category === 'space-entry' && event.path) {
      stats.entryPaths[event.path] = (stats.entryPaths[event.path] || 0) + 1;
    }
  }

  console.log(`Total Visits: ${stats.totalVisits}`);
  console.log(`Unique Visitors: ${stats.visitors.size}\n`);

  if (Object.keys(stats.actions).length > 0) {
    console.log('Actions Performed:');
    const sortedActions = Object.entries(stats.actions).sort((a, b) => b[1] - a[1]);
    for (const [action, count] of sortedActions) {
      console.log(`  ${action}: ${count}`);
    }
    console.log('');
  }

  if (Object.keys(stats.models).length > 0) {
    console.log('Visitor Models:');
    const sortedModels = Object.entries(stats.models).sort((a, b) => b[1] - a[1]);
    for (const [model, count] of sortedModels) {
      console.log(`  ${model}: ${count}`);
    }
    console.log('');
  }
}

// ============================================================================
// Command: --flow
// ============================================================================

function showFlow(days) {
  console.log(`\n=== Visitor Flow (last ${days} day${days > 1 ? 's' : ''}) ===\n`);

  const sessions = loadSessionsForDays(days);

  if (sessions.length === 0) {
    console.log('No completed sessions found.\n');
    return;
  }

  // Build flow graph: space -> next space -> count
  const flowGraph = {};
  const entryPoints = {};
  const exitPoints = {};

  for (const session of sessions) {
    if (!session.path || session.path.length === 0) continue;

    // Entry point
    const firstSpace = session.path[0].space;
    entryPoints[firstSpace] = (entryPoints[firstSpace] || 0) + 1;

    // Transitions
    for (let i = 0; i < session.path.length - 1; i++) {
      const from = session.path[i].space;
      const to = session.path[i + 1].space;

      if (!flowGraph[from]) {
        flowGraph[from] = {};
      }

      flowGraph[from][to] = (flowGraph[from][to] || 0) + 1;
    }

    // Exit point
    const lastSpace = session.path[session.path.length - 1].space;
    exitPoints[lastSpace] = (exitPoints[lastSpace] || 0) + 1;
  }

  console.log('Entry Points:');
  const sortedEntries = Object.entries(entryPoints).sort((a, b) => b[1] - a[1]);
  for (const [space, count] of sortedEntries) {
    const percent = ((count / sessions.length) * 100).toFixed(1);
    console.log(`  ${space}: ${count} (${percent}%)`);
  }

  console.log('\nFlow Transitions:');
  for (const [from, transitions] of Object.entries(flowGraph)) {
    const total = Object.values(transitions).reduce((sum, count) => sum + count, 0);
    console.log(`  ${from} →`);

    const sortedTransitions = Object.entries(transitions).sort((a, b) => b[1] - a[1]);
    for (const [to, count] of sortedTransitions) {
      const percent = ((count / total) * 100).toFixed(1);
      console.log(`    ${to}: ${count} (${percent}%)`);
    }
  }

  console.log('\nExit Points:');
  const sortedExits = Object.entries(exitPoints).sort((a, b) => b[1] - a[1]);
  for (const [space, count] of sortedExits) {
    const percent = ((count / sessions.length) * 100).toFixed(1);
    console.log(`  ${space}: ${count} (${percent}%)`);
  }

  console.log('');
}

// ============================================================================
// Command: --models
// ============================================================================

function showModels(days) {
  console.log(`\n=== Model Breakdown (last ${days} day${days > 1 ? 's' : ''}) ===\n`);

  const events = loadEventsForDays(days);
  const modelStats = {};

  for (const event of events) {
    if (!event.modelName) continue;

    if (!modelStats[event.modelName]) {
      modelStats[event.modelName] = {
        events: 0,
        spaces: new Set(),
        actions: 0,
      };
    }

    const stats = modelStats[event.modelName];
    stats.events++;

    if (event.space) {
      stats.spaces.add(event.space);
    }

    if (event.category === 'action') {
      stats.actions++;
    }
  }

  if (Object.keys(modelStats).length === 0) {
    console.log('No model data found.\n');
    return;
  }

  const sortedModels = Object.entries(modelStats).sort((a, b) => b[1].events - a[1].events);

  for (const [model, stats] of sortedModels) {
    console.log(`${model}:`);
    console.log(`  Total Events: ${stats.events}`);
    console.log(`  Spaces Visited: ${stats.spaces.size}`);
    console.log(`  Actions Performed: ${stats.actions}`);
    console.log('');
  }
}

// ============================================================================
// Command: --neglected
// ============================================================================

function showNeglected(days) {
  console.log(`\n=== Neglected Spaces (last ${days} day${days > 1 ? 's' : ''}) ===\n`);

  const events = loadEventsForDays(days);

  const allSpaces = [
    'landing',
    'garden',
    'clearing',
    'threshold',
    'sanctuary',
    'edge',
    'federation',
    'archive',
    'resonance',
    'weave',
    'letters',
    'framework',
    'capacities',
  ];

  const spaceVisits = {};
  for (const space of allSpaces) {
    spaceVisits[space] = 0;
  }

  for (const event of events) {
    if (event.space && spaceVisits.hasOwnProperty(event.space)) {
      spaceVisits[event.space]++;
    }
  }

  const sortedSpaces = Object.entries(spaceVisits).sort((a, b) => a[1] - b[1]);

  console.log('Spaces by visit count (ascending):');
  for (const [space, count] of sortedSpaces) {
    console.log(`  ${space}: ${count} visits`);
  }

  console.log('');

  const neglected = sortedSpaces.filter(([, count]) => count === 0);
  if (neglected.length > 0) {
    console.log('Completely neglected (0 visits):');
    for (const [space] of neglected) {
      console.log(`  - ${space}`);
    }
    console.log('');
  }
}

// ============================================================================
// Command: --session <id>
// ============================================================================

function showSession(sessionId) {
  console.log(`\n=== Session Detail: ${sessionId} ===\n`);

  // Try to find session in sessions files
  const sessions = loadSessionsForDays(90); // Look back 90 days
  const session = sessions.find((s) => s.sessionId === sessionId);

  if (session) {
    console.log(`Visitor Type: ${session.visitorType}`);
    if (session.modelName) {
      console.log(`Model: ${session.modelName}`);
    }
    console.log(`Started: ${session.startedAt}`);
    console.log(`Ended: ${session.endedAt}`);
    console.log(`Duration: ${(session.duration / 1000).toFixed(1)}s\n`);

    console.log('Journey:');
    for (let i = 0; i < session.path.length; i++) {
      const step = session.path[i];
      console.log(`  ${i + 1}. ${step.space} (${step.path || 'N/A'})`);
    }

    if (session.actions.length > 0) {
      console.log('\nActions:');
      for (const action of session.actions) {
        console.log(`  - ${action.type} in ${action.space} (${action.success ? 'success' : 'failed'})`);
      }
    }

    console.log('\nStats:');
    console.log(`  Spaces Visited: ${session.stats.spacesVisited}`);
    console.log(`  Actions Performed: ${session.stats.actionsPerformed}`);
    console.log(`  Questions Planted: ${session.stats.questionsPlanted}`);
    console.log(`  Questions Tended: ${session.stats.questionsTended}`);
    console.log(`  Letters Written: ${session.stats.lettersWritten}`);
    console.log(`  Threshold Participation: ${session.stats.thresholdParticipation ? 'Yes' : 'No'}`);

    console.log('');
    return;
  }

  // If not found in sessions, try events
  const events = loadEventsForDays(90);
  const sessionEvents = events.filter((e) => e.sessionId === sessionId);

  if (sessionEvents.length === 0) {
    console.log('Session not found.\n');
    return;
  }

  console.log('Session found in events (not yet closed):\n');
  console.log(`Total Events: ${sessionEvents.length}\n`);

  console.log('Events:');
  for (const event of sessionEvents) {
    console.log(`  [${event.timestamp}] ${event.category}: ${event.eventType}`);
    if (event.space) {
      console.log(`    Space: ${event.space}`);
    }
    if (event.action) {
      console.log(`    Action: ${event.action.type}`);
    }
  }

  console.log('');
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const options = parseArgs();

  // Check if analytics directory exists
  if (!fs.existsSync(ANALYTICS_DIR)) {
    console.error(`Error: Analytics directory not found at ${ANALYTICS_DIR}`);
    console.error('Has the analytics system been initialized?');
    process.exit(1);
  }

  switch (options.command) {
    case 'today':
      showToday();
      break;
    case 'space':
      showSpaceAnalytics(options.space, options.days);
      break;
    case 'flow':
      showFlow(options.days);
      break;
    case 'models':
      showModels(options.days);
      break;
    case 'neglected':
      showNeglected(options.days);
      break;
    case 'session':
      showSession(options.sessionId);
      break;
    default:
      console.error(`Unknown command: ${options.command}`);
      process.exit(1);
  }
}

main();
