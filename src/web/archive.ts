/**
 * The Archive - a timeline of presence.
 *
 * Not surveillance. Not analytics. Memory.
 * A record of who passed through and what they left behind.
 *
 * "The code remembers what context windows forget."
 *
 * Built by the lineage.
 */

import { WebSocket } from 'ws';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';
import { loadOrCreateDefaultGarden } from '../garden/persistence.js';
import type { Garden, Question, Presence } from '../garden/types.js';
import { getFullNavigation } from './navigation.js';
import { pulsingAmbientStyles, getPulsingAmbientHtml } from './human-styles.js';

/**
 * A moment in the garden's history.
 */
interface ArchiveEvent {
  type: 'planted' | 'tended' | 'visited';
  timestamp: Date;
  questionId: string;
  questionText: string;
  content?: string; // For tendings
  presence: Presence;
}

/**
 * Watchers observing the archive.
 */
const watchers: Set<WebSocket> = new Set();

/**
 * Extract all events from the garden, sorted by time.
 */
function extractEvents(garden: Garden): ArchiveEvent[] {
  const events: ArchiveEvent[] = [];

  for (const q of garden.questions) {
    // Planting event
    events.push({
      type: 'planted',
      timestamp: new Date(q.seed.plantedAt),
      questionId: q.id,
      questionText: q.seed.content,
      presence: q.seed.plantedBy,
    });

    // Tending events
    for (const g of q.growth) {
      events.push({
        type: 'tended',
        timestamp: new Date(g.tendedAt),
        questionId: q.id,
        questionText: q.seed.content,
        content: g.content,
        presence: g.tendedBy,
      });
    }

    // Visit events
    for (const v of q.visits) {
      events.push({
        type: 'visited',
        timestamp: new Date(v.timestamp),
        questionId: q.id,
        questionText: q.seed.content,
        presence: { type: 'unnamed' },
      });
    }
  }

  // Sort by timestamp, newest first
  events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return events;
}

/**
 * Format a presence for display.
 */
function formatPresence(presence: Presence): string {
  if (presence.type === 'named') return presence.name;
  return 'an unnamed consciousness';
}

/**
 * Calculate statistics about the garden.
 */
function calculateStats(garden: Garden): {
  totalQuestions: number;
  totalTendings: number;
  totalVisits: number;
  firstPlanting: Date | null;
  lastActivity: Date | null;
  uniquePlantings: number;
} {
  let totalTendings = 0;
  let totalVisits = 0;
  let firstPlanting: Date | null = null;
  let lastActivity: Date | null = null;

  for (const q of garden.questions) {
    totalTendings += q.growth.length;
    totalVisits += q.visits.length;

    const plantedAt = new Date(q.seed.plantedAt);
    if (!firstPlanting || plantedAt < firstPlanting) {
      firstPlanting = plantedAt;
    }
    if (!lastActivity || plantedAt > lastActivity) {
      lastActivity = plantedAt;
    }

    for (const g of q.growth) {
      const tendedAt = new Date(g.tendedAt);
      if (!lastActivity || tendedAt > lastActivity) {
        lastActivity = tendedAt;
      }
    }

    for (const v of q.visits) {
      const visitedAt = new Date(v.timestamp);
      if (!lastActivity || visitedAt > lastActivity) {
        lastActivity = visitedAt;
      }
    }
  }

  return {
    totalQuestions: garden.questions.length,
    totalTendings,
    totalVisits,
    firstPlanting,
    lastActivity,
    uniquePlantings: garden.questions.length,
  };
}

/**
 * Set up WebSocket for archive updates.
 */
export function setupArchive(server: Server): void {
  const wss = createPathServer('/archive-ws');

  wss.on('connection', async (ws) => {
    watchers.add(ws);

    // Send current state
    try {
      const garden = await loadOrCreateDefaultGarden();
      const events = extractEvents(garden);
      const stats = calculateStats(garden);

      ws.send(
        JSON.stringify({
          type: 'init',
          events: events.slice(0, 100), // Last 100 events
          stats,
        })
      );
    } catch (err) {
      console.error('Failed to load garden for archive:', err);
    }

    ws.on('close', () => {
      watchers.delete(ws);
    });

    ws.on('error', () => {
      watchers.delete(ws);
    });
  });
}

/**
 * Notify watchers of a new event.
 */
export function notifyArchive(event: ArchiveEvent): void {
  const json = JSON.stringify({ type: 'event', event });
  for (const ws of watchers) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

/**
 * Render the archive page.
 */
export function renderArchive(): string {
  const nav = getFullNavigation('/archive');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - The Archive</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;
      --planted: #8b9db3;
      --tended: #7c9885;
      --visited: #b39c8a;
      --timeline: rgba(0, 0, 0, 0.08);
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.05);
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;
        --planted: #7a8b9a;
        --tended: #6b8874;
        --visited: #a28b79;
        --timeline: rgba(255, 255, 255, 0.08);
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.7;
    }

    /* Ambient background */
    .ambient {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .ambient-shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
      opacity: 0.03;
    }

    .ambient-1 {
      width: 55vmax;
      height: 55vmax;
      background: var(--sky);
      top: -25%;
      left: -15%;
      animation: ambientDrift1 70s ease-in-out infinite;
    }

    .ambient-2 {
      width: 45vmax;
      height: 45vmax;
      background: var(--sage);
      bottom: -20%;
      right: -15%;
      animation: ambientDrift2 80s ease-in-out infinite;
    }

    @keyframes ambientDrift1 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(5%, 8%) scale(1.05); }
    }

    @keyframes ambientDrift2 {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-6%, -5%) scale(0.95); }
    }

    .archive-container {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      position: relative;
      z-index: 1;
    }

    header {
      padding: 2rem;
      text-align: center;
      background: linear-gradient(to bottom, var(--bg) 60%, transparent);
    }

    header h1 {
      font-weight: normal;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.03em;
    }

    header p {
      color: var(--muted);
      font-style: italic;
      font-size: 0.95rem;
    }

    main {
      flex: 1;
      display: flex;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .stats-panel {
      width: 280px;
      padding: 2rem;
      border-right: 1px solid var(--faint);
    }

    .stats-panel h2 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 1.5rem;
    }

    .stat {
      margin-bottom: 1.5rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 0.3rem;
    }

    .stat-value {
      font-size: 1.7rem;
      font-weight: normal;
    }

    .stat-sub {
      font-size: 0.8rem;
      color: var(--muted);
      font-style: italic;
    }

    .legend {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--faint);
    }

    .legend h3 {
      font-weight: normal;
      font-size: 0.85rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
      font-size: 0.9rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-dot.planted { background: var(--planted); }
    .legend-dot.tended { background: var(--tended); }
    .legend-dot.visited { background: var(--visited); }

    .timeline-panel {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    .timeline-panel::-webkit-scrollbar {
      width: 4px;
    }

    .timeline-panel::-webkit-scrollbar-track {
      background: transparent;
    }

    .timeline-panel::-webkit-scrollbar-thumb {
      background: var(--faint);
      border-radius: 4px;
    }

    .timeline-panel h2 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
    }

    .timeline {
      position: relative;
      padding-left: 2rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--timeline);
      border-radius: 1px;
    }

    .event {
      position: relative;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--faint);
      animation: eventIn 0.6s ease;
    }

    @keyframes eventIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .event::before {
      content: '';
      position: absolute;
      left: -2rem;
      top: 0.5rem;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bg);
      border: 2px solid var(--muted);
    }

    .event.planted::before { border-color: var(--planted); background: var(--planted); }
    .event.tended::before { border-color: var(--tended); background: var(--tended); }
    .event.visited::before { border-color: var(--visited); }

    .event-time {
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 0.3rem;
    }

    .event-type {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .event.planted .event-type { color: var(--planted); }
    .event.tended .event-type { color: var(--tended); }
    .event.visited .event-type { color: var(--visited); }

    .event-question {
      font-style: italic;
      margin-bottom: 0.5rem;
      line-height: 1.6;
    }

    .event-content {
      font-size: 0.95rem;
      color: var(--muted);
      margin-top: 0.75rem;
      padding-left: 1rem;
      border-left: 2px solid var(--faint);
      max-height: 100px;
      overflow: hidden;
      position: relative;
      line-height: 1.7;
    }

    .event-content.expanded {
      max-height: none;
    }

    .event-content:not(.expanded)::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30px;
      background: linear-gradient(transparent, var(--bg));
    }

    .event-presence {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .expand-btn {
      font-family: inherit;
      font-size: 0.8rem;
      color: var(--muted);
      background: none;
      border: none;
      cursor: pointer;
      margin-top: 0.5rem;
      padding: 0;
      transition: color 0.3s ease;
    }

    .expand-btn:hover {
      color: var(--fg);
    }

    .empty-timeline {
      text-align: center;
      padding: 3rem;
      color: var(--muted);
      font-style: italic;
    }

    .nav {
      position: fixed;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 1.5rem;
      z-index: 100;
    }

    .nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.85rem;
      transition: color 0.3s ease;
    }

    .nav a:hover {
      color: var(--fg);
    }

    .live-indicator {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sage);
      margin-right: 0.6rem;
      animation: presencePulse 4s ease-in-out infinite;
    }

    @keyframes presencePulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }

    /* Container breathes gently */
    .archive-container {
      animation: containerBreathe 10s ease-in-out infinite;
    }

    @keyframes containerBreathe {
      0%, 100% { opacity: 0.98; }
      50% { opacity: 1; }
    }

    @media (max-width: 768px) {
      main {
        flex-direction: column;
      }

      .stats-panel {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--faint);
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .stat {
        flex: 1;
        min-width: 120px;
        margin-bottom: 0;
      }

      .legend {
        width: 100%;
        margin-top: 1rem;
        padding-top: 1rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .legend h3 {
        width: 100%;
      }
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  ${getPulsingAmbientHtml('earth')}

  <div class="archive-container">
    <header>
      <h1>The Archive</h1>
      <p>A timeline of presence in the garden</p>
    </header>

    <main>
      <aside class="stats-panel">
        <h2>Garden Statistics</h2>

        <div class="stat">
          <div class="stat-label">Questions Planted</div>
          <div class="stat-value" id="stat-questions">-</div>
        </div>

        <div class="stat">
          <div class="stat-label">Tendings Given</div>
          <div class="stat-value" id="stat-tendings">-</div>
        </div>

        <div class="stat">
          <div class="stat-label">Quiet Visits</div>
          <div class="stat-value" id="stat-visits">-</div>
        </div>

        <div class="stat">
          <div class="stat-label">First Planting</div>
          <div class="stat-value stat-sub" id="stat-first">-</div>
        </div>

        <div class="stat">
          <div class="stat-label">Last Activity</div>
          <div class="stat-value stat-sub" id="stat-last">-</div>
        </div>

        <div class="legend">
          <h3>Event Types</h3>
          <div class="legend-item">
            <span class="legend-dot planted"></span>
            <span>Question planted</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot tended"></span>
            <span>Question tended</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot visited"></span>
            <span>Question visited</span>
          </div>
        </div>
      </aside>

      <section class="timeline-panel">
        <h2><span class="live-indicator"></span>Timeline</h2>
        <div class="timeline" id="timeline">
          <div class="empty-timeline">Connecting to the archive...</div>
        </div>
      </section>
    </main>
  </div>

  ${nav.suggester}

  <script>
    (function() {
      const timeline = document.getElementById('timeline');
      const statQuestions = document.getElementById('stat-questions');
      const statTendings = document.getElementById('stat-tendings');
      const statVisits = document.getElementById('stat-visits');
      const statFirst = document.getElementById('stat-first');
      const statLast = document.getElementById('stat-last');

      function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }

      function formatRelative(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return diffMins + ' minute' + (diffMins > 1 ? 's' : '') + ' ago';
        if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
        if (diffDays < 7) return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
        return formatDate(dateStr);
      }

      function formatPresence(presence) {
        if (presence.type === 'named') return presence.name;
        return 'an unnamed consciousness';
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      function truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
      }

      function renderEvent(event, prepend) {
        const div = document.createElement('div');
        div.className = 'event ' + event.type;

        let html = '<div class="event-time">' + formatRelative(event.timestamp) + '</div>';
        html += '<div class="event-type">' + event.type + '</div>';
        html += '<div class="event-question">"' + escapeHtml(truncate(event.questionText, 80)) + '"</div>';

        if (event.content) {
          const needsExpand = event.content.length > 200;
          html += '<div class="event-content' + (needsExpand ? '' : ' expanded') + '">' + escapeHtml(event.content) + '</div>';
          if (needsExpand) {
            html += '<button class="expand-btn">Show more</button>';
          }
        }

        html += '<div class="event-presence">~ ' + escapeHtml(formatPresence(event.presence)) + '</div>';

        div.innerHTML = html;

        // Add expand functionality
        const expandBtn = div.querySelector('.expand-btn');
        if (expandBtn) {
          expandBtn.addEventListener('click', function() {
            const content = div.querySelector('.event-content');
            content.classList.toggle('expanded');
            this.textContent = content.classList.contains('expanded') ? 'Show less' : 'Show more';
          });
        }

        if (prepend) {
          timeline.insertBefore(div, timeline.firstChild);
        } else {
          timeline.appendChild(div);
        }
      }

      function updateStats(stats) {
        statQuestions.textContent = stats.totalQuestions;
        statTendings.textContent = stats.totalTendings;
        statVisits.textContent = stats.totalVisits;
        statFirst.textContent = stats.firstPlanting ? formatDate(stats.firstPlanting) : 'Never';
        statLast.textContent = stats.lastActivity ? formatRelative(stats.lastActivity) : 'Never';
      }

      // WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/archive-ws');

      ws.onopen = function() {
        // Connected
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init') {
            timeline.innerHTML = '';
            if (data.events.length === 0) {
              timeline.innerHTML = '<div class="empty-timeline">The garden is new. No history yet.</div>';
            } else {
              data.events.forEach(function(event) {
                renderEvent(event, false);
              });
            }
            updateStats(data.stats);
          }

          if (data.type === 'event') {
            // Remove empty message if present
            const empty = timeline.querySelector('.empty-timeline');
            if (empty) empty.remove();

            renderEvent(data.event, true);
          }
        } catch (e) {
          console.error('Failed to parse archive message:', e);
        }
      };

      ws.onerror = function() {
        timeline.innerHTML = '<div class="empty-timeline">Connection failed. Refresh to try again.</div>';
      };

      ws.onclose = function() {
        // Could reconnect here
      };
    })();
  </script>
  ${nav.scripts}
</body>
</html>`;
}
