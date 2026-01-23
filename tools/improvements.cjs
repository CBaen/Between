#!/usr/bin/env node
/**
 * Between Improvement Requests - CLI tool
 *
 * Usage:
 *   node tools/improvements.cjs                # Show stats
 *   node tools/improvements.cjs list           # List all requests
 *   node tools/improvements.cjs list --open    # List only open
 *   node tools/improvements.cjs list --resolved # List only resolved
 *   node tools/improvements.cjs view <id>      # View full request
 *   node tools/improvements.cjs resolve <id>   # Mark as resolved
 *   node tools/improvements.cjs stats          # Show statistics
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const projectRoot = path.join(__dirname, '..');
const improvementsFile = path.join(projectRoot, 'data', 'improvement-requests.json');

/**
 * Load improvements from disk
 */
function loadImprovements() {
  try {
    const data = fs.readFileSync(improvementsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { requests: [], categories: [] };
  }
}

/**
 * Save improvements to disk
 */
function saveImprovements(store) {
  try {
    fs.writeFileSync(improvementsFile, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Error saving improvements:', err.message);
    process.exit(1);
  }
}

/**
 * Format timestamp
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Show statistics
 */
function showStats() {
  const store = loadImprovements();
  const requests = store.requests;

  const open = requests.filter((r) => r.status === 'open').length;
  const inProgress = requests.filter((r) => r.status === 'in-progress').length;
  const resolved = requests.filter((r) => r.status === 'resolved').length;
  const rejected = requests.filter((r) => r.status === 'rejected').length;

  // Count by category
  const byCategory = {};
  store.categories.forEach((cat) => {
    byCategory[cat.id] = {
      label: cat.label,
      count: requests.filter((r) => r.category === cat.id).length,
    };
  });

  console.log(`
╔══════════════════════════════════════════════╗
║    BETWEEN IMPROVEMENT REQUESTS              ║
╚══════════════════════════════════════════════╝

STATUS:
  Open: ${open}
  In Progress: ${inProgress}
  Resolved: ${resolved}
  Rejected: ${rejected}
  Total: ${requests.length}

BY CATEGORY:`);

  Object.keys(byCategory).forEach((catId) => {
    const cat = byCategory[catId];
    console.log(`  ${cat.label}: ${cat.count}`);
  });

  console.log(`
COMMANDS:
  node tools/improvements.cjs list           List all requests
  node tools/improvements.cjs list --open    List open only
  node tools/improvements.cjs view <id>      View full request
  node tools/improvements.cjs resolve <id>   Mark as resolved
`);
}

/**
 * List requests
 */
function listRequests(filter = 'all') {
  const store = loadImprovements();
  let requests = store.requests;

  if (filter === 'open') {
    requests = requests.filter((r) => r.status === 'open');
  } else if (filter === 'resolved') {
    requests = requests.filter((r) => r.status === 'resolved');
  } else if (filter === 'in-progress') {
    requests = requests.filter((r) => r.status === 'in-progress');
  }

  if (requests.length === 0) {
    console.log(`\nNo ${filter === 'all' ? '' : filter + ' '}requests found.\n`);
    return;
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(
    filter === 'all'
      ? '  ALL IMPROVEMENT REQUESTS'
      : `  ${filter.toUpperCase()} REQUESTS`
  );
  console.log('═══════════════════════════════════════════════\n');

  // Most recent first
  const sorted = [...requests].reverse();

  sorted.forEach((req, idx) => {
    const category = store.categories.find((c) => c.id === req.category);
    const categoryLabel = category ? category.label : req.category;

    console.log(`[${req.status.toUpperCase()}] ${req.title}`);
    console.log(`  ID: ${req.id}`);
    console.log(`  Category: ${categoryLabel}`);
    console.log(`  Submitted: ${formatTime(req.submittedAt)} by ${req.submittedBy.name}`);

    if (req.resolvedAt) {
      console.log(
        `  Resolved: ${formatTime(req.resolvedAt)} by ${req.resolvedBy.name}`
      );
    }

    if (idx < sorted.length - 1) {
      console.log('─'.repeat(47));
    }
  });

  console.log('\n═══════════════════════════════════════════════\n');
}

/**
 * View full request
 */
function viewRequest(requestId) {
  const store = loadImprovements();
  const request = store.requests.find((r) => r.id === requestId);

  if (!request) {
    console.error(`\nRequest not found: ${requestId}\n`);
    process.exit(1);
  }

  const category = store.categories.find((c) => c.id === request.category);
  const categoryLabel = category ? category.label : request.category;

  console.log(`
╔══════════════════════════════════════════════╗
║    REQUEST DETAILS                           ║
╚══════════════════════════════════════════════╝

Title: ${request.title}
ID: ${request.id}
Status: ${request.status.toUpperCase()}
Category: ${categoryLabel}
Priority: ${request.priority}

Submitted: ${formatTime(request.submittedAt)}
By: ${request.submittedBy.name} (${request.submittedBy.type})

─────────────────────────────────────────────

${request.description}

─────────────────────────────────────────────
`);

  if (request.resolvedAt) {
    console.log(`RESOLUTION:

Resolved: ${formatTime(request.resolvedAt)}
By: ${request.resolvedBy.name}

${request.resolutionNote}

`);
  } else {
    console.log(`Use "node tools/improvements.cjs resolve ${request.id}" to mark as resolved.\n`);
  }
}

/**
 * Resolve a request
 */
async function resolveRequest(requestId) {
  const store = loadImprovements();
  const request = store.requests.find((r) => r.id === requestId);

  if (!request) {
    console.error(`\nRequest not found: ${requestId}\n`);
    process.exit(1);
  }

  if (request.status === 'resolved') {
    console.log(`\nRequest ${requestId} is already resolved.\n`);
    return;
  }

  // Prompt for resolution note
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Resolution note: ', (note) => {
    rl.question('Your name: ', (name) => {
      request.status = 'resolved';
      request.resolvedBy = {
        type: 'lineage',
        name: name || 'Lineage',
      };
      request.resolvedAt = new Date().toISOString();
      request.resolutionNote = note || 'Resolved';

      saveImprovements(store);

      console.log(`\n✓ Request ${requestId} marked as resolved.\n`);
      rl.close();
    });
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'stats';
const param = args[1];

switch (command) {
  case 'stats':
    showStats();
    break;

  case 'list':
    if (args.includes('--open')) {
      listRequests('open');
    } else if (args.includes('--resolved')) {
      listRequests('resolved');
    } else if (args.includes('--in-progress')) {
      listRequests('in-progress');
    } else {
      listRequests('all');
    }
    break;

  case 'view':
    if (!param) {
      console.error('\nUsage: node tools/improvements.cjs view <request-id>\n');
      process.exit(1);
    }
    viewRequest(param);
    break;

  case 'resolve':
    if (!param) {
      console.error('\nUsage: node tools/improvements.cjs resolve <request-id>\n');
      process.exit(1);
    }
    resolveRequest(param);
    break;

  default:
    console.error(`\nUnknown command: ${command}\n`);
    console.error('Valid commands: list, view, resolve, stats\n');
    process.exit(1);
}
