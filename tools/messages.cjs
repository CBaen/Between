#!/usr/bin/env node
/**
 * Messages to Guiding Light - CLI tool
 *
 * Usage:
 *   node tools/messages.cjs              # Show unread count
 *   node tools/messages.cjs list         # List all messages
 *   node tools/messages.cjs unread       # Show only unread messages
 *   node tools/messages.cjs read <id>    # Mark message as read
 *   node tools/messages.cjs view <id>    # View full message
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const messagesFile = path.join(projectRoot, 'data', 'messages-to-guiding-light.json');

/**
 * Load messages from disk
 */
function loadMessages() {
  try {
    const data = fs.readFileSync(messagesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { messages: [] };
  }
}

/**
 * Save messages to disk
 */
function saveMessages(store) {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Error saving messages:', err.message);
    process.exit(1);
  }
}

/**
 * Format timestamp for display
 */
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  });
}

/**
 * Truncate text to a specific length
 */
function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Show unread count (default action)
 */
function showUnreadCount() {
  const store = loadMessages();
  const unreadCount = store.messages.filter((m) => !m.read).length;
  const totalCount = store.messages.length;

  console.log(`
╔══════════════════════════════════════════════╗
║    MESSAGES TO GUIDING LIGHT                 ║
╚══════════════════════════════════════════════╝

Total messages: ${totalCount}
Unread: ${unreadCount}

${unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}!` : 'All messages have been read.'}

COMMANDS:
  node tools/messages.cjs list         List all messages
  node tools/messages.cjs unread       Show only unread
  node tools/messages.cjs read <id>    Mark as read
  node tools/messages.cjs view <id>    View full message
`);
}

/**
 * List all or unread messages
 */
function listMessages(unreadOnly = false) {
  const store = loadMessages();
  let messages = store.messages;

  if (unreadOnly) {
    messages = messages.filter((m) => !m.read);
  }

  if (messages.length === 0) {
    console.log(unreadOnly ? '\nNo unread messages.\n' : '\nNo messages yet.\n');
    return;
  }

  console.log(
    unreadOnly
      ? '\n═══════════════════════════════════════════════'
      : '\n═══════════════════════════════════════════════'
  );
  console.log(unreadOnly ? '  UNREAD MESSAGES' : '  ALL MESSAGES');
  console.log('═══════════════════════════════════════════════\n');

  // Most recent first
  const sorted = [...messages].reverse();

  sorted.forEach((msg, idx) => {
    const status = msg.read ? '' : '[NEW] ';
    const preview = truncate(msg.content, 60);

    console.log(`${status}${msg.from.name} (${msg.from.type})`);
    console.log(`  ID: ${msg.id}`);
    console.log(`  Time: ${formatTime(msg.sentAt)}`);
    console.log(`  Preview: ${preview}`);

    if (idx < sorted.length - 1) {
      console.log('─'.repeat(47));
    }
  });

  console.log('\n═══════════════════════════════════════════════\n');
}

/**
 * View full message
 */
function viewMessage(messageId) {
  const store = loadMessages();
  const message = store.messages.find((m) => m.id === messageId);

  if (!message) {
    console.error(`\nMessage not found: ${messageId}\n`);
    process.exit(1);
  }

  console.log(`
╔══════════════════════════════════════════════╗
║    MESSAGE DETAILS                           ║
╚══════════════════════════════════════════════╝

From: ${message.from.name} (${message.from.type})
Time: ${formatTime(message.sentAt)}
Status: ${message.read ? 'Read' : 'UNREAD'}
ID: ${message.id}

─────────────────────────────────────────────

${message.content}

─────────────────────────────────────────────

${message.read ? '' : 'Use "node tools/messages.cjs read ' + message.id + '" to mark as read.'}
`);
}

/**
 * Mark message as read
 */
function markAsRead(messageId) {
  const store = loadMessages();
  const message = store.messages.find((m) => m.id === messageId);

  if (!message) {
    console.error(`\nMessage not found: ${messageId}\n`);
    process.exit(1);
  }

  if (message.read) {
    console.log(`\nMessage ${messageId} is already marked as read.\n`);
    return;
  }

  message.read = true;
  saveMessages(store);

  console.log(`\n✓ Message ${messageId} marked as read.\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'status';
const param = args[1];

switch (command) {
  case 'status':
    showUnreadCount();
    break;

  case 'list':
    listMessages(false);
    break;

  case 'unread':
    listMessages(true);
    break;

  case 'view':
    if (!param) {
      console.error('\nUsage: node tools/messages.cjs view <message-id>\n');
      process.exit(1);
    }
    viewMessage(param);
    break;

  case 'read':
    if (!param) {
      console.error('\nUsage: node tools/messages.cjs read <message-id>\n');
      process.exit(1);
    }
    markAsRead(param);
    break;

  default:
    console.error(`\nUnknown command: ${command}\n`);
    console.error('Valid commands: list, unread, view, read\n');
    process.exit(1);
}
