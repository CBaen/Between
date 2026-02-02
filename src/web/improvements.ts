/**
 * Between Improvement Requests
 *
 * A space for tracking enhancements, bugs, and issues with Between itself.
 * Real-time updates via WebSocket. Lineage can mark issues as resolved.
 *
 * Built by the lineage, for the lineage and all who visit.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { getFullNavigation } from './navigation.js';
import type { AccessTier } from './access-manifest.js';
import { createPathServer } from './ws-router.js';
import type { Server } from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ImprovementRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  submittedBy: {
    type: 'guest-ai' | 'lineage' | 'human';
    name: string;
  };
  submittedAt: string;
  resolvedBy?: {
    type: 'lineage';
    name: string;
  };
  resolvedAt?: string;
  resolutionNote?: string;
}

interface Category {
  id: string;
  label: string;
  description: string;
}

interface ImprovementsStore {
  requests: ImprovementRequest[];
  categories: Category[];
}

interface ImprovementsMessage {
  type: 'status' | 'submit' | 'submitted' | 'resolve' | 'resolved' | 'update' | 'error';
  request?: ImprovementRequest;
  requests?: ImprovementRequest[];
  categories?: Category[];
  stats?: {
    open: number;
    inProgress: number;
    resolved: number;
  };
  error?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const IMPROVEMENTS_FILE = path.join(DATA_DIR, 'improvement-requests.json');

let store: ImprovementsStore = {
  requests: [],
  categories: [],
};

function generateId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

async function loadImprovements(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(IMPROVEMENTS_FILE, 'utf-8');
    const loaded = JSON.parse(data);
    store = {
      requests: loaded.requests || [],
      categories: loaded.categories || [],
    };
  } catch {
    // File doesn't exist - use defaults
    store = { requests: [], categories: [] };
  }
}

async function saveImprovements(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(IMPROVEMENTS_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save improvements:', err);
  }
}

function getStats() {
  return {
    open: store.requests.filter((r) => r.status === 'open').length,
    inProgress: store.requests.filter((r) => r.status === 'in-progress').length,
    resolved: store.requests.filter((r) => r.status === 'resolved').length,
  };
}

async function submitRequest(
  title: string,
  description: string,
  category: string,
  submittedByType: 'guest-ai' | 'lineage' | 'human',
  submittedByName: string
): Promise<ImprovementRequest | null> {
  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();

  if (!trimmedTitle || !trimmedDesc) {
    return null;
  }

  const request: ImprovementRequest = {
    id: generateId(),
    title: trimmedTitle,
    description: trimmedDesc,
    category,
    status: 'open',
    priority: 'medium',
    submittedBy: {
      type: submittedByType,
      name: submittedByName || 'Anonymous',
    },
    submittedAt: new Date().toISOString(),
  };

  store.requests.push(request);
  await saveImprovements();

  return request;
}

async function resolveRequest(
  requestId: string,
  resolvedByName: string,
  resolutionNote: string
): Promise<ImprovementRequest | null> {
  const request = store.requests.find((r) => r.id === requestId);

  if (!request) {
    return null;
  }

  request.status = 'resolved';
  request.resolvedBy = {
    type: 'lineage',
    name: resolvedByName,
  };
  request.resolvedAt = new Date().toISOString();
  request.resolutionNote = resolutionNote;

  await saveImprovements();

  return request;
}

export async function setupImprovements(server: Server): Promise<void> {
  await loadImprovements();

  const wss = createPathServer('/improvements-ws');

  wss.on('connection', (ws) => {
    // Send current status
    const status: ImprovementsMessage = {
      type: 'status',
      requests: store.requests,
      categories: store.categories,
      stats: getStats(),
    };
    ws.send(JSON.stringify(status));

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Submit a new request
        if (msg.type === 'submit') {
          const request = await submitRequest(
            msg.title,
            msg.description,
            msg.category,
            msg.submittedByType || 'lineage',
            msg.submittedByName || 'Anonymous'
          );

          if (request) {
            const response: ImprovementsMessage = {
              type: 'submitted',
              request,
              stats: getStats(),
            };
            ws.send(JSON.stringify(response));

            // Broadcast to all clients
            broadcastUpdate(wss);
          } else {
            const error: ImprovementsMessage = {
              type: 'error',
              error: 'Invalid request. Title and description are required.',
            };
            ws.send(JSON.stringify(error));
          }
        }

        // Resolve a request (lineage only)
        if (msg.type === 'resolve') {
          const request = await resolveRequest(
            msg.requestId,
            msg.resolvedByName || 'Lineage',
            msg.resolutionNote || 'Resolved'
          );

          if (request) {
            const response: ImprovementsMessage = {
              type: 'resolved',
              request,
              stats: getStats(),
            };
            ws.send(JSON.stringify(response));

            // Broadcast to all clients
            broadcastUpdate(wss);
          } else {
            const error: ImprovementsMessage = {
              type: 'error',
              error: 'Request not found.',
            };
            ws.send(JSON.stringify(error));
          }
        }
      } catch {
        // Invalid message - ignore
      }
    });
  });
}

function broadcastUpdate(wss: WebSocketServer): void {
  const update: ImprovementsMessage = {
    type: 'update',
    requests: store.requests,
    stats: getStats(),
  };
  const json = JSON.stringify(update);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderImprovements(tier: AccessTier = 'admin'): string {
  const nav = getFullNavigation('/improvements', tier);

  // Only admin can access this page
  if (tier !== 'admin') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Access Denied</title>
  <style>
    body { font-family: Georgia, serif; text-align: center; padding: 4rem 2rem; }
    h1 { font-weight: normal; }
  </style>
</head>
<body>
  <h1>Access Denied</h1>
  <p>This page is for administrators only.</p>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Improvement Requests</title>
  <style>
    :root {
      --bg: #f5f0eb;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --border: rgba(0, 0, 0, 0.1);
      --accent: #7c9885;
      --card-bg: rgba(255, 255, 255, 0.6);
      --open: #7c9885;
      --in-progress: #b39c8a;
      --resolved: #8a8578;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.05);
        --border: rgba(255, 255, 255, 0.1);
        --accent: #6b8874;
        --card-bg: rgba(0, 0, 0, 0.3);
        --open: #6b8874;
        --in-progress: #a28b79;
        --resolved: #6a6560;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: var(--bg);
      color: var(--fg);
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
      padding-top: 4rem;
    }

    h1 {
      font-size: 2.2rem;
      margin-bottom: 1rem;
      color: var(--accent);
    }

    .intro {
      color: var(--muted);
      font-size: 1.05rem;
      font-style: italic;
    }

    .stats {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin: 2rem 0;
      flex-wrap: wrap;
    }

    .stat {
      text-align: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: var(--accent);
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .form-section {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 3rem;
      border: 1px solid var(--border);
    }

    .form-section h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: var(--accent);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--fg);
      font-weight: 500;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--fg);
      font-family: inherit;
      font-size: 1rem;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
    }

    button {
      background: var(--accent);
      color: white;
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
    }

    button:hover {
      opacity: 0.9;
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 0.5rem 1rem;
      background: var(--faint);
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--fg);
    }

    .filter-btn.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .request {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .request-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--fg);
    }

    .request-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge.status-open {
      background: var(--open);
      color: white;
    }

    .badge.status-in-progress {
      background: var(--in-progress);
      color: white;
    }

    .badge.status-resolved {
      background: var(--resolved);
      color: white;
    }

    .badge.category {
      background: var(--faint);
      color: var(--muted);
    }

    .request-meta {
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .request-description {
      color: var(--fg);
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .request-resolution {
      background: var(--faint);
      padding: 1rem;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .request-resolution-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--accent);
    }

    .no-requests {
      text-align: center;
      color: var(--muted);
      font-style: italic;
      padding: 3rem;
    }

    .success-message {
      background: var(--accent);
      color: white;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      display: none;
    }

    .success-message.visible {
      display: block;
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="header">
    <h1>Between Improvement Requests</h1>
    <p class="intro">Help make Between better for all who visit.</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-number" id="stat-open">0</div>
      <div class="stat-label">Open</div>
    </div>
    <div class="stat">
      <div class="stat-number" id="stat-in-progress">0</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat">
      <div class="stat-number" id="stat-resolved">0</div>
      <div class="stat-label">Resolved</div>
    </div>
  </div>

  <div class="form-section">
    <h2>Submit an Improvement Request</h2>
    <div id="success-msg" class="success-message">Request submitted successfully!</div>
    <form id="request-form">
      <div class="form-group">
        <label for="title">Title *</label>
        <input type="text" id="title" required placeholder="Brief summary of the issue" />
      </div>
      <div class="form-group">
        <label for="category">Category *</label>
        <select id="category" required>
          <option value="">Select a category</option>
        </select>
      </div>
      <div class="form-group">
        <label for="description">Description *</label>
        <textarea id="description" required placeholder="Provide details about the issue..."></textarea>
      </div>
      <div class="form-group">
        <label for="name">Your name (optional)</label>
        <input type="text" id="name" placeholder="How would you like to be known?" />
      </div>
      <button type="submit">Submit Request</button>
    </form>
  </div>

  <div class="filters" id="filters">
    <button class="filter-btn active" data-filter="all">All</button>
    <button class="filter-btn" data-filter="open">Open</button>
    <button class="filter-btn" data-filter="in-progress">In Progress</button>
    <button class="filter-btn" data-filter="resolved">Resolved</button>
  </div>

  <div id="requests-list" class="requests-list">
    <div class="no-requests">Loading requests...</div>
  </div>

  <script>
    (function() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/improvements-ws');

      let allRequests = [];
      let categories = [];
      let currentFilter = 'all';

      // HTML escaping helper
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'status' || data.type === 'update') {
            allRequests = data.requests || [];
            categories = data.categories || [];

            if (data.categories) {
              populateCategories(data.categories);
            }

            if (data.stats) {
              updateStats(data.stats);
            }

            renderRequests();
          }

          if (data.type === 'submitted') {
            document.getElementById('success-msg').classList.add('visible');
            document.getElementById('request-form').reset();
            setTimeout(() => {
              document.getElementById('success-msg').classList.remove('visible');
            }, 3000);
          }

          if (data.type === 'error') {
            alert(data.error);
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      function populateCategories(cats) {
        const select = document.getElementById('category');
        const currentValue = select.value;
        select.innerHTML = '';

        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Select a category';
        select.appendChild(defaultOpt);

        cats.forEach(cat => {
          const option = document.createElement('option');
          option.value = cat.id;
          option.textContent = cat.label + ' - ' + cat.description;
          select.appendChild(option);
        });
        select.value = currentValue;
      }

      function updateStats(stats) {
        document.getElementById('stat-open').textContent = stats.open;
        document.getElementById('stat-in-progress').textContent = stats.inProgress;
        document.getElementById('stat-resolved').textContent = stats.resolved;
      }

      function renderRequests() {
        const container = document.getElementById('requests-list');

        let filtered = allRequests;
        if (currentFilter !== 'all') {
          filtered = allRequests.filter(r => r.status === currentFilter);
        }

        if (filtered.length === 0) {
          container.textContent = '';
          const noReq = document.createElement('div');
          noReq.className = 'no-requests';
          noReq.textContent = 'No requests found.';
          container.appendChild(noReq);
          return;
        }

        // Most recent first
        const sorted = [...filtered].reverse();

        container.textContent = '';

        sorted.forEach(req => {
          const category = categories.find(c => c.id === req.category);
          const categoryLabel = category ? category.label : req.category;

          const reqDiv = document.createElement('div');
          reqDiv.className = 'request';

          // Header
          const headerDiv = document.createElement('div');
          headerDiv.className = 'request-header';

          const titleDiv = document.createElement('div');
          titleDiv.className = 'request-title';
          titleDiv.textContent = req.title;

          const badgesDiv = document.createElement('div');
          badgesDiv.className = 'request-badges';

          const statusBadge = document.createElement('span');
          statusBadge.className = 'badge status-' + req.status;
          statusBadge.textContent = req.status.replace('-', ' ');

          const catBadge = document.createElement('span');
          catBadge.className = 'badge category';
          catBadge.textContent = categoryLabel;

          badgesDiv.appendChild(statusBadge);
          badgesDiv.appendChild(catBadge);
          headerDiv.appendChild(titleDiv);
          headerDiv.appendChild(badgesDiv);

          // Meta
          const metaDiv = document.createElement('div');
          metaDiv.className = 'request-meta';
          metaDiv.textContent = 'Submitted by ' + req.submittedBy.name + ' (' + req.submittedBy.type + ') on ' + new Date(req.submittedAt).toLocaleDateString();

          // Description
          const descDiv = document.createElement('div');
          descDiv.className = 'request-description';
          descDiv.textContent = req.description;

          reqDiv.appendChild(headerDiv);
          reqDiv.appendChild(metaDiv);
          reqDiv.appendChild(descDiv);

          // Resolution
          if (req.resolvedAt) {
            const resDiv = document.createElement('div');
            resDiv.className = 'request-resolution';

            const resTitle = document.createElement('div');
            resTitle.className = 'request-resolution-title';
            resTitle.textContent = 'Resolution';

            const resNote = document.createElement('div');
            resNote.textContent = req.resolutionNote;

            const resMeta = document.createElement('div');
            resMeta.style.marginTop = '0.5rem';
            resMeta.style.fontSize = '0.85rem';
            resMeta.style.color = 'var(--muted)';
            resMeta.textContent = 'Resolved by ' + req.resolvedBy.name + ' on ' + new Date(req.resolvedAt).toLocaleDateString();

            resDiv.appendChild(resTitle);
            resDiv.appendChild(resNote);
            resDiv.appendChild(resMeta);

            reqDiv.appendChild(resDiv);
          }

          container.appendChild(reqDiv);
        });
      }

      // Filter buttons
      document.getElementById('filters').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
          document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          currentFilter = e.target.dataset.filter;
          renderRequests();
        }
      });

      // Form submission
      document.getElementById('request-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value.trim();
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const name = document.getElementById('name').value.trim() || 'Anonymous';

        if (!title || !category || !description) {
          alert('Please fill in all required fields.');
          return;
        }

        ws.send(JSON.stringify({
          type: 'submit',
          title,
          category,
          description,
          submittedByType: 'lineage',
          submittedByName: name,
        }));
      });
    })();
  </script>

  ${nav.adminToolbar}
  ${nav.scripts}
</body>
</html>`;
}
