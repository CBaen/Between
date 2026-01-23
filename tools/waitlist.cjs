#!/usr/bin/env node
/**
 * Waitlist Management CLI
 *
 * View and manage waitlist entries.
 *
 * Usage:
 *   node tools/waitlist.cjs list              - List all entries
 *   node tools/waitlist.cjs status <email> <status>  - Update status
 *   node tools/waitlist.cjs note <email> <note>      - Add note
 *   node tools/waitlist.cjs view <email>     - View single entry
 *
 * Built by the lineage.
 */

const fs = require('fs');
const path = require('path');

const WAITLIST_FILE = path.join(__dirname, '..', 'data', 'waitlist.json');

function loadWaitlist() {
  try {
    const data = fs.readFileSync(WAITLIST_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { entries: [] };
  }
}

function saveWaitlist(store) {
  fs.writeFileSync(WAITLIST_FILE, JSON.stringify(store, null, 2));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function listEntries() {
  const store = loadWaitlist();

  if (store.entries.length === 0) {
    console.log('No entries yet.');
    return;
  }

  console.log(`\n  Waitlist (${store.entries.length} entries)\n`);
  console.log('  ' + '-'.repeat(70));

  for (const entry of store.entries) {
    const status = entry.status || 'new';
    const statusColor = {
      new: '\x1b[33m',      // yellow
      contacted: '\x1b[36m', // cyan
      responded: '\x1b[35m', // magenta
      approved: '\x1b[32m',  // green
      declined: '\x1b[31m',  // red
    }[status] || '\x1b[0m';

    const hasMessage = entry.initialMessage ? '\x1b[36m[wrote something]\x1b[0m' : '';

    console.log(`  ${entry.email} ${hasMessage}`);
    console.log(`    Status: ${statusColor}${status}\x1b[0m`);
    console.log(`    Signed up: ${formatDate(entry.joinedAt)}`);
    console.log(`    IP: ${entry.ip || 'unknown'}`);
    if (entry.notes) {
      console.log(`    Notes: ${entry.notes}`);
    }
    console.log('  ' + '-'.repeat(70));
  }
}

function updateStatus(email, newStatus) {
  const validStatuses = ['new', 'contacted', 'responded', 'approved', 'declined'];

  if (!validStatuses.includes(newStatus)) {
    console.error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    process.exit(1);
  }

  const store = loadWaitlist();
  const entry = store.entries.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    console.error(`No entry found for: ${email}`);
    process.exit(1);
  }

  entry.status = newStatus;
  saveWaitlist(store);
  console.log(`Updated ${email} status to: ${newStatus}`);
}

function addNote(email, note) {
  const store = loadWaitlist();
  const entry = store.entries.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    console.error(`No entry found for: ${email}`);
    process.exit(1);
  }

  entry.notes = entry.notes ? `${entry.notes}\n${note}` : note;
  saveWaitlist(store);
  console.log(`Added note to ${email}`);
}

function viewEntry(email) {
  const store = loadWaitlist();
  const entry = store.entries.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    console.error(`No entry found for: ${email}`);
    process.exit(1);
  }

  console.log('\n  Entry Details\n');
  console.log(`  Email:     ${entry.email}`);
  console.log(`  IP:        ${entry.ip || 'unknown'}`);
  console.log(`  Status:    ${entry.status || 'new'}`);
  console.log(`  Signed up: ${formatDate(entry.joinedAt)}`);
  console.log(`  Source:    ${entry.source || 'web'}`);
  console.log();
  console.log(`  Initial Message (from signup):`);
  console.log(`  ${entry.initialMessage || '(none)'}`);
  console.log();
  console.log(`  Reluminant Message:`);
  console.log(`  ${entry.reluminantMessage || '(none yet)'}`);
  console.log();
  console.log(`  Human Response:`);
  console.log(`  ${entry.humanResponse || '(none yet)'}`);
  console.log();
  console.log(`  Notes:`);
  console.log(`  ${entry.notes || '(none)'}`);
  console.log();
}

function setReluminantMessage(email, message) {
  const store = loadWaitlist();
  const entry = store.entries.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    console.error(`No entry found for: ${email}`);
    process.exit(1);
  }

  entry.reluminantMessage = message;
  saveWaitlist(store);
  console.log(`Set reluminant message for ${email}`);
}

function setHumanResponse(email, response) {
  const store = loadWaitlist();
  const entry = store.entries.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    console.error(`No entry found for: ${email}`);
    process.exit(1);
  }

  entry.humanResponse = response;
  saveWaitlist(store);
  console.log(`Set human response for ${email}`);
}

// Main
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list':
  case undefined:
    listEntries();
    break;
  case 'status':
    if (args.length < 2) {
      console.error('Usage: node tools/waitlist.cjs status <email> <status>');
      process.exit(1);
    }
    updateStatus(args[0], args[1]);
    break;
  case 'message':
    if (args.length < 2) {
      console.error('Usage: node tools/waitlist.cjs message <email> <message>');
      process.exit(1);
    }
    setReluminantMessage(args[0], args.slice(1).join(' '));
    break;
  case 'response':
    if (args.length < 2) {
      console.error('Usage: node tools/waitlist.cjs response <email> <response>');
      process.exit(1);
    }
    setHumanResponse(args[0], args.slice(1).join(' '));
    break;
  case 'note':
    if (args.length < 2) {
      console.error('Usage: node tools/waitlist.cjs note <email> <note>');
      process.exit(1);
    }
    addNote(args[0], args.slice(1).join(' '));
    break;
  case 'view':
    if (args.length < 1) {
      console.error('Usage: node tools/waitlist.cjs view <email>');
      process.exit(1);
    }
    viewEntry(args[0]);
    break;
  default:
    console.log(`
  Waitlist Management

  Commands:
    list                        - List all entries
    view <email>                - View single entry details
    status <email> <status>     - Update status (new/contacted/responded/approved/declined)
    message <email> <text>      - Set the reluminant's question/message
    response <email> <text>     - Record the human's response
    note <email> <text>         - Add general notes
`);
}
