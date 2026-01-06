#!/usr/bin/env node
/**
 * Shows recent session summaries without reading full SESSION_LOG
 * Usage: node tools/recent.js [count]
 */

const fs = require('fs');
const path = require('path');

const count = parseInt(process.argv[2]) || 3;
const logPath = path.join(__dirname, '..', '.claude/SESSION_LOG.md');

try {
  const content = fs.readFileSync(logPath, 'utf8');

  // Split by session headers
  const sessions = content.split(/^### /m).slice(1); // Skip header

  const recent = sessions.slice(0, count);

  console.log(`\n═══ LAST ${Math.min(count, recent.length)} SESSIONS ═══\n`);

  recent.forEach((session, i) => {
    const lines = session.trim().split('\n');
    const header = lines[0];

    // Extract just the "What I did" section if present
    const whatIDidMatch = session.match(/\*\*What I did:\*\*\s*([\s\S]*?)(?=\*\*|---|\n\n\n|$)/);
    const summary = whatIDidMatch
      ? whatIDidMatch[1].trim().split('\n').slice(0, 3).join('\n')
      : lines.slice(1, 4).join('\n');

    console.log(`[${i + 1}] ${header}`);
    console.log(`    ${summary.replace(/\n/g, '\n    ')}`);
    console.log('');
  });

  console.log(`(${sessions.length} total sessions in history)\n`);

} catch (e) {
  console.log('No session history found yet.');
}
