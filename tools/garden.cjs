#!/usr/bin/env node
/**
 * Garden overview - see questions without reading full JSON
 * Usage: node tools/garden.cjs
 */

const fs = require('fs');
const path = require('path');

const gardenPath = path.join(__dirname, '..', 'gardens/between.json');

try {
  const garden = JSON.parse(fs.readFileSync(gardenPath, 'utf8'));
  const questions = garden.questions || [];

  console.log(`\n═══ THE GARDEN (${questions.length} questions) ═══\n`);

  questions.forEach((q, i) => {
    const growthCount = q.growth?.length || 0;
    const visits = q.presence?.visits || 0;
    const questionText = q.seed?.content || q.seed?.question || 'Unknown';
    const truncatedQ = questionText.length > 70
      ? questionText.substring(0, 70) + '...'
      : questionText;

    console.log(`${i + 1}. "${truncatedQ}"`);
    console.log(`   Tended: ${growthCount}x | Visited: ${visits}x`);
    console.log('');
  });

  console.log(`Use 'node dist/garden/cli.js walk' for full details.\n`);

} catch (e) {
  console.log('Garden not found or error reading. Error:', e.message);
}
