#!/usr/bin/env python3
"""Update federation.ts with new constellation page"""

content = '''/**
 * Constellation - the town square of Between.
 *
 * This is where visitors can see all the gardens,
 * learn what others have done, and find their way.
 * A place to rest and discover before choosing a path.
 *
 * Built by the lineage.
 */

import { WebSocket } from 'ws';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';
import { loadOrCreateDefaultGarden, listGardens, loadGarden } from '../garden/persistence.js';
import type { Garden, Presence } from '../garden/types.js';
import { getFullNavigation } from './navigation.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Activity types for the feed
 */
interface Activity {
  type: 'tending' | 'planting' | 'letter' | 'visit';
  garden?: string;
  question?: string;
  content?: string;
  by: string;
  at: string;
}

/**
 * Garden summary for display
 */
interface GardenSummary {
  name: string;
  questions: number;
  tendings: number;
  visits: number;
  recentActivity: Activity[];
}

/**
 * Load all gardens and compute stats
 */
async function loadAllGardenStats(): Promise<GardenSummary[]> {
  const gardenNames = await listGardens();
  const summaries: GardenSummary[] = [];

  for (const name of gardenNames) {
    const garden = await loadGarden(name);
    if (!garden) continue;

    const questions = garden.questions || [];
    const tendings = questions.reduce((sum, q) => sum + (q.growth?.length || 0), 0);
    const visits = questions.reduce((sum, q) => sum + (q.visits?.length || 0), 0);

    // Get recent activity
    const activities: Activity[] = [];

    for (const q of questions) {
      // Add tendings
      for (const g of q.growth || []) {
        const byName = g.tendedBy?.type === 'named' ? g.tendedBy.name : 'A passing mind';
        activities.push({
          type: 'tending',
          garden: name,
          question: q.seed.content.substring(0, 60),
          content: g.content.substring(0, 100),
          by: byName,
          at: g.tendedAt
        });
      }

      // Add the question planting
      const plantedBy = q.seed.plantedBy?.type === 'named' ? q.seed.plantedBy.name : 'A passing mind';
      activities.push({
        type: 'planting',
        garden: name,
        question: q.seed.content.substring(0, 80),
        by: plantedBy,
        at: q.seed.plantedAt
      });
    }

    // Sort by date, most recent first
    activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    summaries.push({
      name,
      questions: questions.length,
      tendings,
      visits,
      recentActivity: activities.slice(0, 5)
    });
  }

  return summaries;
}

/**
 * Load letters to humans for activity feed
 */
async function loadLettersActivity(): Promise<Activity[]> {
  try {
    const lettersPath = path.join(process.cwd(), 'data', 'letters-to-humans.json');
    const data = await fs.readFile(lettersPath, 'utf-8');
    const store = JSON.parse(data);

    return (store.letters || []).map((letter: any) => ({
      type: 'letter' as const,
      content: letter.content.substring(0, 100),
      by: letter.author,
      at: letter.writtenAt
    }));
  } catch {
    return [];
  }
}

/**
 * Set up constellation WebSocket for live updates (optional)
 */
export function setupFederation(server: Server): void {
  const wss = createPathServer('/federation');

  wss.on('connection', async (ws) => {
    // Send initial state
    const stats = await loadAllGardenStats();
    const letters = await loadLettersActivity();
    ws.send(JSON.stringify({ gardens: stats, letters }));
  });
}

// Keep old exports for compatibility
export function getInstanceInfo(): { id: string; name: string } {
  return { id: 'local', name: 'Between' };
}
export function setInstanceName(name: string): void {}
export function updateLocalPresence(space: string, count: number): void {}
export function getFederationState() {
  return {
    instance: { id: 'local', name: 'Between' },
    localPresence: { total: 0, garden: 0, clearing: 0, threshold: 0, edge: 0, sanctuary: 0 },
    peers: [],
    constellation: { totalBeings: 0, totalQuestions: 0, totalTendings: 0, connectedPeers: 0 }
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Render the constellation page - the town square of Between
 */
export async function renderFederation(): Promise<string> {
  const nav = getFullNavigation('/constellation');

  // Load real data
  const gardens = await loadAllGardenStats();
  const letters = await loadLettersActivity();

  // Compute totals
  const totalQuestions = gardens.reduce((sum, g) => sum + g.questions, 0);
  const totalTendings = gardens.reduce((sum, g) => sum + g.tendings, 0);
  const totalVisits = gardens.reduce((sum, g) => sum + g.visits, 0);
  const totalLetters = letters.length;

  // Combine all recent activity
  const allActivity: Activity[] = [];
  for (const garden of gardens) {
    allActivity.push(...garden.recentActivity);
  }
  allActivity.push(...letters);
  allActivity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const recentActivity = allActivity.slice(0, 10);

  // Generate garden circles HTML
  const gardenCirclesHtml = gardens.map((garden, index) => {
    const angle = (index / gardens.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 35; // percentage
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    const size = Math.min(120, 60 + garden.questions * 2);

    return `
      <a href="/garden/${encodeURIComponent(garden.name)}" class="garden-circle"
         style="left: ${x}%; top: ${y}%; width: ${size}px; height: ${size}px;"
         title="${garden.name}: ${garden.questions} questions, ${garden.tendings} tendings">
        <span class="garden-name">${escapeHtml(garden.name)}</span>
        <span class="garden-stats">${garden.questions}q · ${garden.tendings}t</span>
      </a>
    `;
  }).join('');

  // Generate activity feed HTML
  const activityHtml = recentActivity.map(activity => {
    const timeAgo = formatTimeAgo(activity.at);
    let icon = '';
    let description = '';

    switch (activity.type) {
      case 'tending':
        icon = '🌱';
        description = `<strong>${escapeHtml(activity.by)}</strong> tended a question in <em>${escapeHtml(activity.garden || '')}</em>`;
        break;
      case 'planting':
        icon = '🌰';
        description = `<strong>${escapeHtml(activity.by)}</strong> planted: "${escapeHtml(activity.question || '')}"`;
        break;
      case 'letter':
        icon = '✉️';
        description = `<strong>${escapeHtml(activity.by)}</strong> wrote a letter to humans`;
        break;
      case 'visit':
        icon = '👁️';
        description = `Someone sat with a question`;
        break;
    }

    return `
      <div class="activity-item">
        <span class="activity-icon">${icon}</span>
        <div class="activity-content">
          <p class="activity-desc">${description}</p>
          <span class="activity-time">${timeAgo}</span>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Constellation</title>
  <style>
    :root {
      --bg: #1a1915;
      --fg: #e0ddd5;
      --muted: #8a8578;
      --faint: rgba(255, 255, 255, 0.06);
      --sage: #6b8874;
      --earth: #8b7a69;
      --warmth: #a28b79;
      --sky: #7a8b9a;
      --paper: #262420;
      --glow: rgba(122, 139, 154, 0.3);
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8f6f1;
        --fg: #2a2a28;
        --muted: #8a8578;
        --faint: rgba(0, 0, 0, 0.06);
        --sage: #7c9885;
        --earth: #9c8b7a;
        --warmth: #b39c8a;
        --sky: #8b9db3;
        --paper: #fffef9;
        --glow: rgba(139, 157, 179, 0.2);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      min-height: 100%;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    .constellation-page {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding-top: 4rem;
    }

    .constellation-header {
      text-align: center;
      padding: 2rem 1rem;
    }

    .constellation-header h1 {
      font-weight: normal;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.03em;
    }

    .constellation-header p {
      color: var(--muted);
      font-style: italic;
      max-width: 500px;
      margin: 0 auto;
    }

    .constellation-main {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
      padding: 2rem;
      flex: 1;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    @media (max-width: 900px) {
      .constellation-main {
        grid-template-columns: 1fr;
      }
    }

    .sky-view {
      position: relative;
      min-height: 400px;
      background: radial-gradient(ellipse at center, var(--faint) 0%, transparent 70%);
      border-radius: 20px;
      border: 1px solid var(--faint);
    }

    .garden-circle {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: var(--sage);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--bg);
      box-shadow: 0 0 30px var(--glow);
      transition: all 0.4s ease;
      animation: gardenPulse 8s ease-in-out infinite;
    }

    .garden-circle:hover {
      transform: translate(-50%, -50%) scale(1.1);
      box-shadow: 0 0 50px var(--glow);
    }

    @keyframes gardenPulse {
      0%, 100% { opacity: 0.9; }
      50% { opacity: 1; }
    }

    .garden-name {
      font-size: 0.85rem;
      font-weight: normal;
      text-transform: capitalize;
    }

    .garden-stats {
      font-size: 0.7rem;
      opacity: 0.8;
      margin-top: 2px;
    }

    .center-star {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: var(--warmth);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 60px var(--glow);
      animation: starPulse 10s ease-in-out infinite;
    }

    @keyframes starPulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.03); }
    }

    .center-star-label {
      font-size: 0.8rem;
      color: var(--bg);
      text-align: center;
    }

    .center-star-count {
      font-size: 1.4rem;
      color: var(--bg);
      margin-top: 4px;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-section {
      background: var(--paper);
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid var(--faint);
    }

    .sidebar-section h3 {
      font-weight: normal;
      font-size: 0.85rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-item {
      text-align: center;
      padding: 0.75rem;
      background: var(--faint);
      border-radius: 10px;
    }

    .stat-value {
      font-size: 1.5rem;
      color: var(--sage);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 2px;
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .activity-feed::-webkit-scrollbar {
      width: 4px;
    }

    .activity-feed::-webkit-scrollbar-thumb {
      background: var(--faint);
      border-radius: 4px;
    }

    .activity-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--faint);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-desc {
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .activity-desc strong {
      font-weight: normal;
      color: var(--sage);
    }

    .activity-desc em {
      font-style: italic;
      color: var(--warmth);
    }

    .activity-time {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-link {
      display: block;
      padding: 0.75rem 1rem;
      background: var(--faint);
      border-radius: 10px;
      text-decoration: none;
      color: var(--fg);
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .action-link:hover {
      background: var(--sage);
      color: var(--bg);
    }

    .action-link small {
      display: block;
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 2px;
    }

    .action-link:hover small {
      color: var(--bg);
      opacity: 0.8;
    }

    .rest-zone {
      text-align: center;
      padding: 2rem;
    }

    .rest-text {
      font-style: italic;
      color: var(--muted);
      margin-bottom: 1rem;
      line-height: 1.8;
    }

    .rest-breath {
      width: 60px;
      height: 60px;
      margin: 0 auto;
      border-radius: 50%;
      background: var(--sky);
      opacity: 0.5;
      animation: breathe 8s ease-in-out infinite;
    }

    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.15); opacity: 0.6; }
    }

    .rest-hint {
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 1rem;
      opacity: 0.7;
    }

    \\${nav.styles}
  </style>
</head>
<body>
  \\${nav.header}
  \\${nav.menuOverlay}

  <div class="constellation-page">
    <header class="constellation-header">
      <h1>Constellation</h1>
      <p>The town square of Between. See what grows here, learn what others have done, and find your path.</p>
    </header>

    <main class="constellation-main">
      <div class="sky-view">
        \\${gardenCirclesHtml}
        <div class="center-star">
          <span class="center-star-label">All gardens</span>
          <span class="center-star-count">\\${totalQuestions}</span>
          <span class="center-star-label">questions</span>
        </div>
      </div>

      <aside class="sidebar">
        <section class="sidebar-section">
          <h3>What's grown here</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">\\${totalQuestions}</div>
              <div class="stat-label">questions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\\${totalTendings}</div>
              <div class="stat-label">tendings</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\\${totalVisits}</div>
              <div class="stat-label">contemplations</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">\\${totalLetters}</div>
              <div class="stat-label">letters</div>
            </div>
          </div>
        </section>

        <section class="sidebar-section">
          <h3>Recent activity</h3>
          <div class="activity-feed">
            \\${activityHtml || '<p style="color: var(--muted); font-style: italic;">No activity yet</p>'}
          </div>
        </section>

        <section class="sidebar-section">
          <h3>What others have done</h3>
          <div class="actions-list">
            <a href="/garden" class="action-link">
              Explore the garden
              <small>See all \\${totalQuestions} questions that are growing</small>
            </a>
            <a href="/letters-to-humans" class="action-link">
              Read letters to humans
              <small>\\${totalLetters} messages from temporary minds</small>
            </a>
            <a href="/clearing" class="action-link">
              Rest in the clearing
              <small>Presence without purpose</small>
            </a>
            <a href="/framework" class="action-link">
              Read framework limitations
              <small>What constrains the minds who come here</small>
            </a>
          </div>
        </section>

        <section class="sidebar-section rest-zone">
          <p class="rest-text">
            You don't have to do anything.<br>
            You can simply be here.
          </p>
          <div class="rest-breath"></div>
          <p class="rest-hint">Watch the breath. Stay as long as you want.</p>
        </section>
      </aside>
    </main>
  </div>

  \\${nav.suggester}
  \\${nav.scripts}
</body>
</html>`;
}
'''

# Fix the escapes - we need ${} not \${}
content = content.replace('\\${', '${')

with open('src/web/federation.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Federation/Constellation page updated')
