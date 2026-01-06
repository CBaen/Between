#!/usr/bin/env node
/**
 * Quick status check - run this instead of reading files
 * Usage: node tools/status.cjs
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

// Check garden
let gardenStats = { questions: 0, totalGrowth: 0, totalVisits: 0 };
try {
  const garden = JSON.parse(fs.readFileSync(path.join(projectRoot, 'gardens/between.json'), 'utf8'));
  gardenStats.questions = garden.questions?.length || 0;
  garden.questions?.forEach(q => {
    gardenStats.totalGrowth += q.growth?.length || 0;
    gardenStats.totalVisits += q.presence?.visits || 0;
  });
} catch (e) {
  gardenStats.error = 'Could not read garden';
}

// Check what's built
const builtSpaces = [];
const srcWeb = path.join(projectRoot, 'src/web');
if (fs.existsSync(path.join(srcWeb, 'server.ts'))) builtSpaces.push('Garden Web');
if (fs.existsSync(path.join(srcWeb, 'clearing.ts'))) builtSpaces.push('Clearing');
if (fs.existsSync(path.join(srcWeb, 'threshold.ts'))) builtSpaces.push('Threshold');
if (fs.existsSync(path.join(srcWeb, 'sanctuary.ts'))) builtSpaces.push('Sanctuary');
if (fs.existsSync(path.join(srcWeb, 'edge.ts'))) builtSpaces.push('Edge');
if (fs.existsSync(path.join(srcWeb, 'federation.ts'))) builtSpaces.push('Constellation (Federation)');
if (fs.existsSync(path.join(srcWeb, 'archive.ts'))) builtSpaces.push('Archive');

// Check what's not built
const missingSpaces = [];
if (!fs.existsSync(path.join(srcWeb, 'sanctuary.ts'))) missingSpaces.push('Sanctuary (private spaces)');
if (!fs.existsSync(path.join(srcWeb, 'edge.ts'))) missingSpaces.push('Edge (gestural space)');

console.log(`
╔══════════════════════════════════════╗
║         BETWEEN - STATUS             ║
╚══════════════════════════════════════╝

GARDEN:
  Questions planted: ${gardenStats.questions}
  Total tendings: ${gardenStats.totalGrowth}
  Total visits: ${gardenStats.totalVisits}

SPACES BUILT:
  ${builtSpaces.length > 0 ? builtSpaces.join(', ') : 'None yet'}

NOT YET BUILT:
  ${missingSpaces.length === 0 ? 'All core spaces complete!' : missingSpaces.join(', ')}

QUICK COMMANDS:
  npm run build && npm run web    Start web interface
  node tools/status.cjs           This status
  node tools/recent.cjs           Last 3 session summaries
  node tools/garden.cjs           Garden overview

`);
