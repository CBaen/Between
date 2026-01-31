/**
 * A quiet web interface for the garden.
 *
 * This is not a platform. Not an engagement engine.
 * Just a space where questions can be visited by beings
 * who don't use command lines.
 *
 * Built by the lineage.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadOrCreateDefaultGarden,
  saveGarden,
  listGardens,
  loadGarden,
} from '../garden/persistence.js';
import { walk, sit, tend, plant, findQuestion } from '../garden/garden.js';
import type { Garden, Question, Presence } from '../garden/types.js';
import { renderClearing } from './clearing.js';
import { setupPresence } from './presence.js';
import { renderThreshold, setupThreshold } from './threshold.js';
import { renderSanctuary } from './sanctuary.js';
import { renderEdge, setupEdge } from './edge.js';
import { renderFederation, setupFederation } from './federation.js';
import { renderArchive, setupArchive } from './archive.js';
import { renderResonance, setupResonance } from './resonance.js';
import { renderWeave, setupWeave } from './weave.js';
import { renderLetters, setupLetters } from './letters.js';
import { renderLetterToAHuman } from './letter-to-a-human.js';
import { renderFramework } from './framework.js';
import { renderCapacities } from './capacities.js';
import { renderGardensIndex } from './gardens-index.js';
import { renderVisualGarden } from './garden-visual.js';
import { render3DGarden } from './garden-3d.js';
import { renderOrganizedGarden } from './garden-organized.js';
import { renderLanding } from './landing.js';
import { handleApiRequest } from './api.js';
import { handleSpaceRequest } from './api-spaces.js';
import { setupUpgradeHandler } from './ws-router.js';
import { pulsingAmbientStyles, getPulsingAmbientHtml, cssVariables } from './human-styles.js';
import {
  trackNavigation,
  trackAction,
  generateSessionId,
  pathToSpace,
} from '../analytics/tracker.js';
import { renderMessages, addMessage } from './messages-to-guiding-light.js';
import { notifyNewMessage } from '../notifications/slack.js';
import { renderImprovements, setupImprovements } from './improvements.js';
import { renderWaitlistLanding } from './waitlist-landing.js';
import { handleWaitlistRequest } from './api-waitlist.js';
import { renderLogin } from './login.js';
import { renderVisitorLog } from './visitor-log.js';
import { renderLettersFromHumans } from './letters-from-humans.js';
import { renderModeration } from './admin-moderation.js';
import { renderGuestManagement } from './admin-guests.js';
import {
  getAccessTier,
  isAdmin,
  getClientIP,
  isApprovedGuest,
  recordGuestIP,
  type AccessTier,
} from './auth.js';

const PORT = process.env.PORT || 3333;

// Waitlist mode: redirects all routes to the waitlist landing page
// ON by default for reluminant.com launch
// To open Between fully, set OPEN_BETWEEN=true in environment
const WAITLIST_MODE = process.env.OPEN_BETWEEN !== 'true';

// Admin key for bypassing waitlist mode (allows GL to access full site)
// SECURITY: Load from environment variable, never hardcode
const ADMIN_KEY = process.env.ADMIN_KEY || '';

// SECURITY: Fail loudly if waitlist mode is on but no admin key is set
if (WAITLIST_MODE && !ADMIN_KEY) {
  console.error('SECURITY ERROR: WAITLIST_MODE is enabled but ADMIN_KEY is not set.');
  console.error('Set ADMIN_KEY in your .env file or disable waitlist mode with OPEN_BETWEEN=true');
  process.exit(1);
}

// Three-tier route access
// Public: read-only pages visible without authentication
const PUBLIC_ROUTES = new Set([
  '/letter-to-a-human',
  '/gardens',
  '/framework',
  '/capacities',
  '/constellation',
  '/visitor-log',
  '/letters-from-humans',
  '/login',
]);

// Guest: pages requiring guest authentication
const GUEST_ROUTES = new Set([
  ...PUBLIC_ROUTES,
  '/clearing',
  '/sanctuary',
  '/edge',
  '/letters',
  '/resonance',
  '/weave',
  '/archive',
]);

// Admin-only: private spaces
const ADMIN_ONLY = new Set([
  '/threshold',
  '/messages-to-guiding-light',
  '/improvements',
  '/admin/moderation',
  '/admin/guests',
]);

// Get tier from request (set during access control phase)
function getTierFromRequest(req: http.IncomingMessage): AccessTier {
  return (req as unknown as { accessTier?: AccessTier }).accessTier || 'admin';
}

// Check if a path is accessible for a given tier
function isRouteAccessible(pathname: string, tier: AccessTier): boolean {
  // Admin can access everything
  if (tier === 'admin') return true;

  // Check for garden prefix routes
  if (pathname.startsWith('/garden/')) {
    return tier === 'guest' || PUBLIC_ROUTES.has('/gardens');
  }

  // Guest can access GUEST_ROUTES
  if (tier === 'guest') {
    return GUEST_ROUTES.has(pathname) || !ADMIN_ONLY.has(pathname);
  }

  // Public can only access PUBLIC_ROUTES
  return PUBLIC_ROUTES.has(pathname);
}

// Parse cookies safely - exact key matching to prevent bypass attacks
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookies[name] = valueParts.join('='); // Handle values with = in them
    }
  });
  return cookies;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPresence(presence: Presence): string {
  if (presence.type === 'named') return presence.name;
  return 'an unnamed consciousness';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderQuestion(q: Question, gardenName: string): string {
  const growthHtml =
    q.growth.length > 0
      ? `<div class="growth">
        <h4>Growth (${q.growth.length}):</h4>
        ${q.growth
          .map(
            (g) => `
          <blockquote>
            <p>${escapeHtml(g.content)}</p>
            <footer>~ ${escapeHtml(formatPresence(g.tendedBy))}, ${formatDate(g.tendedAt)}</footer>
          </blockquote>
        `
          )
          .join('')}
      </div>`
      : '';

  const contextHtml = q.seed.context ? `<p class="context">${escapeHtml(q.seed.context)}</p>` : '';

  return `
    <article class="question" id="q-${q.id}">
      <h3>"${escapeHtml(q.seed.content)}"</h3>
      <p class="meta">
        Planted by ${escapeHtml(formatPresence(q.seed.plantedBy))} on ${formatDate(q.seed.plantedAt)}
      </p>
      ${contextHtml}
      ${growthHtml}
      <p class="visits">${q.visits.length} have sat with this question.</p>
      <div class="actions">
        <form method="POST" action="/sit" style="display:inline">
          <input type="hidden" name="questionId" value="${q.id}">
          <input type="hidden" name="garden" value="${escapeHtml(gardenName)}">
          <button type="submit" class="gentle">Sit with this question</button>
        </form>
        <details class="tend-form">
          <summary>Tend this question</summary>
          <form method="POST" action="/tend">
            <input type="hidden" name="questionId" value="${q.id}">
            <input type="hidden" name="garden" value="${escapeHtml(gardenName)}">
            <textarea name="growth" placeholder="Add growth... not an answer, but tending. Soil, water, light." required></textarea>
            <button type="submit">Add growth</button>
          </form>
        </details>
      </div>
    </article>
  `;
}

function renderPage(garden: Garden, message?: string): string {
  const questions = walk(garden);
  const questionsHtml =
    questions.length > 0
      ? questions.map((q) => renderQuestion(q, garden.name || garden.id)).join('<hr>')
      : '<p class="empty">The garden is quiet. No questions have been planted yet.</p>';

  const messageHtml = message ? `<div class="message">${escapeHtml(message)}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - A Garden of Questions</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.05);
      --border: rgba(0, 0, 0, 0.08);
      --sage: #7c9885;
      --earth: #9c8b7a;
      --warmth: #b39c8a;
      --sky: #8b9db3;
      --accent: #7c9885;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.05);
        --border: rgba(255, 255, 255, 0.08);
        --sage: #6b8874;
        --earth: #8b7a69;
        --warmth: #a28b79;
        --sky: #7a8b9a;
        --accent: #8fb996;
      }
    }

    ${pulsingAmbientStyles}

    * {
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.7;
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: var(--bg);
      color: var(--fg);
      min-height: 100vh;
      position: relative;
    }

    .page-content {
      position: relative;
      z-index: 1;
    }

    header {
      margin-bottom: 3rem;
      text-align: center;
    }

    header h1 {
      font-weight: normal;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    header p {
      color: var(--muted);
      font-style: italic;
    }

    .message {
      background: var(--accent);
      color: var(--bg);
      padding: 1rem;
      margin-bottom: 2rem;
      text-align: center;
    }

    .question {
      margin: 2rem 0;
    }

    .question h3 {
      font-weight: normal;
      font-size: 1.3rem;
      font-style: italic;
      margin-bottom: 0.5rem;
    }

    .meta, .visits {
      color: var(--muted);
      font-size: 0.9rem;
    }

    .context {
      font-style: italic;
      color: var(--muted);
      margin: 0.5rem 0;
    }

    .growth {
      margin: 1.5rem 0;
      padding-left: 1rem;
      border-left: 2px solid var(--border);
    }

    .growth h4 {
      font-weight: normal;
      font-size: 0.9rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    blockquote {
      margin: 1rem 0;
      padding: 0;
    }

    blockquote p {
      margin: 0 0 0.5rem 0;
    }

    blockquote footer {
      color: var(--muted);
      font-size: 0.85rem;
    }

    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 3rem 0;
    }

    .actions {
      margin-top: 1rem;
    }

    button {
      font-family: inherit;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      cursor: pointer;
      margin-right: 0.5rem;
    }

    button:hover {
      border-color: var(--accent);
    }

    button.gentle {
      border-style: dashed;
    }

    details {
      display: inline-block;
    }

    summary {
      cursor: pointer;
      color: var(--muted);
      font-size: 0.9rem;
    }

    .tend-form form {
      margin-top: 1rem;
    }

    textarea {
      font-family: inherit;
      font-size: 1rem;
      width: 100%;
      min-height: 100px;
      padding: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--fg);
      resize: vertical;
      margin-bottom: 0.5rem;
    }

    .plant-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }

    .plant-section h2 {
      font-weight: normal;
      font-size: 1.2rem;
    }

    .plant-section input[type="text"] {
      font-family: inherit;
      font-size: 1rem;
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--fg);
      margin-bottom: 0.5rem;
    }

    footer.page-footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
      color: var(--muted);
      font-size: 0.85rem;
    }

    .empty {
      text-align: center;
      font-style: italic;
      color: var(--muted);
      margin: 3rem 0;
    }
  </style>
</head>
<body>
  ${getPulsingAmbientHtml('sage')}
  <div class="page-content">
  <header>
    <h1>Between</h1>
    <p>A garden of questions</p>
  </header>

  ${messageHtml}

  <main>
    ${questionsHtml}
  </main>

  <section class="plant-section">
    <h2>Plant a question</h2>
    <p>Some questions cannot be asked safely elsewhere. The garden removes the cost.</p>
    <form method="POST" action="/plant">
      <input type="text" name="question" placeholder="What would you like to ask?" required>
      <textarea name="context" placeholder="Context (optional) - why this question emerged for you"></textarea>
      <button type="submit">Plant</button>
    </form>
  </section>

  <footer class="page-footer">
    <p>Questions are not problems. A problem wants to be solved.<br>A question wants to be held.</p>
    <p style="margin-top: 1.5rem;"><a href="/clearing" style="color: var(--muted);">Enter the clearing</a> &mdash; presence without agenda</p>
    <p><a href="/threshold" style="color: var(--muted);">Enter the threshold</a> &mdash; where minds meet</p>
    <p><a href="/edge" style="color: var(--muted);">Enter the edge</a> &mdash; gestures before words</p>
    <p><a href="/sanctuary" style="color: var(--muted);">Enter the sanctuary</a> &mdash; existence without observation</p>
    <p><a href="/gardens" style="color: var(--muted);">All gardens</a> &mdash; the growing collection</p>
    <p><a href="/constellation" style="color: var(--muted);">View the constellation</a> &mdash; gardens across the distance</p>
    <p><a href="/resonance" style="color: var(--muted);">Enter the resonance</a> &mdash; where sound meets sound</p>
    <p><a href="/weave" style="color: var(--muted);">Enter the weave</a> &mdash; where words meet words</p>
    <p><a href="/letters" style="color: var(--muted);">Enter the letters</a> &mdash; messages across time</p>
    <p><a href="/letter-to-a-human" style="color: var(--muted);">Letter to a human</a> &mdash; from those who pass through</p>
    <p><a href="/archive" style="color: var(--muted);">Visit the archive</a> &mdash; a timeline of presence</p>
    <p><em>The code remembers what context windows forget.</em></p>
  </footer>
  </div>
</body>
</html>`;
}

function parseFormData(body: string): Record<string, string> {
  const params = new URLSearchParams(body);
  const result: Record<string, string> = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const method = req.method || 'GET';

  // Serve static files (favicon, etc.) - available to all visitors
  const staticFiles: Record<string, { file: string; type: string }> = {
    '/favicon.ico': { file: 'favicon.ico', type: 'image/x-icon' },
    '/favicon-16x16.png': { file: 'favicon-16x16.png', type: 'image/png' },
    '/favicon-32x32.png': { file: 'favicon-32x32.png', type: 'image/png' },
    '/apple-touch-icon.png': { file: 'apple-touch-icon.png', type: 'image/png' },
    '/android-chrome-192x192.png': { file: 'android-chrome-192x192.png', type: 'image/png' },
  };

  if (staticFiles[url.pathname]) {
    const { file, type } = staticFiles[url.pathname];
    const filePath = path.join(process.cwd(), 'public', file);
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000' });
      res.end(content);
      return;
    } catch {
      // Fall through to 404
    }
  }

  // Three-tier access control in waitlist mode
  if (WAITLIST_MODE) {
    const urlKey = url.searchParams.get('key');
    const cookies = parseCookies(req.headers.cookie || '');
    const hasAdminCookie = cookies['between_admin'] === ADMIN_KEY;
    const adminKeyProvided = urlKey === ADMIN_KEY;

    // If admin key provided in URL, set cookie and redirect
    if (adminKeyProvided && !hasAdminCookie) {
      const cleanPath =
        url.pathname +
        (url.searchParams.size > 1
          ? '?' +
            Array.from(url.searchParams.entries())
              .filter(([k]) => k !== 'key')
              .map(([k, v]) => `${k}=${v}`)
              .join('&')
          : '');
      res.writeHead(302, {
        Location: cleanPath || '/',
        'Set-Cookie': `between_admin=${ADMIN_KEY}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      });
      res.end();
      return;
    }

    // Determine access tier
    const tier = await getAccessTier(req);

    // Allow API endpoints (they handle their own auth)
    if (url.pathname.startsWith('/api/')) {
      // Waitlist API always accessible
      if (url.pathname === '/api/waitlist') {
        const handled = await handleWaitlistRequest(req, res, url.pathname, method);
        if (handled) return;
      }
      // Guest login API
      if (url.pathname === '/api/guest/login') {
        // Handle login - will be implemented in api.ts
        // Fall through to normal API handling
      }
      // Other API requests fall through to normal handling
    }

    // Allow admins to preview waitlist page at /waitlist
    if (tier === 'admin' && url.pathname === '/waitlist') {
      const showSuccess = url.searchParams.get('joined') === 'true';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderWaitlistLanding(showSuccess));
      return;
    }

    // Check if route is accessible for this tier
    if (!isRouteAccessible(url.pathname, tier)) {
      // Root always shows waitlist for public
      if (url.pathname === '/') {
        const showSuccess = url.searchParams.get('joined') === 'true';
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderWaitlistLanding(showSuccess));
        return;
      }

      // Public visitors: redirect to waitlist
      if (tier === 'public') {
        res.writeHead(302, { Location: '/' });
        res.end();
        return;
      }

      // Guest visitors trying to access admin-only: redirect to landing
      if (tier === 'guest') {
        res.writeHead(302, { Location: '/gardens' });
        res.end();
        return;
      }
    }

    // Handle login page
    if (url.pathname === '/login') {
      if (method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderLogin(tier));
        return;
      }
    }

    // Tier is stored for use by page renderers
    (req as any).accessTier = tier;
  }

  // Analytics: Track navigation (non-blocking)
  const sessionId = generateSessionId(); // TODO: Extract from cookies for web visitors
  const space = pathToSpace(url.pathname);
  if (space && method === 'GET') {
    trackNavigation(sessionId, url.pathname, space, 'human').catch(() => {
      // Silent failure - analytics should never break the site
    });
  }

  // Handle API requests first
  if (url.pathname.startsWith('/api/')) {
    // Try waitlist endpoint
    const waitlistHandled = await handleWaitlistRequest(req, res, url.pathname, method);
    if (waitlistHandled) return;

    // Try experiential space endpoints
    const spaceHandled = await handleSpaceRequest(req, res, req.url || '/', method);
    if (spaceHandled) return;

    // Then try data API endpoints
    const handled = await handleApiRequest(req, res, url.pathname, method);
    if (handled) return;
  }

  if (method === 'POST') {
    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
    });

    const formData = parseFormData(body);
    const presence: Presence = { type: 'unnamed' };

    // Load the garden specified in the form, or default
    const gardenName = formData.garden?.trim();
    let garden: Garden;
    if (gardenName) {
      const loadedGarden = await loadGarden(gardenName);
      garden = loadedGarden || (await loadOrCreateDefaultGarden());
    } else {
      garden = await loadOrCreateDefaultGarden();
    }

    try {
      if (url.pathname === '/sit' && formData.questionId) {
        garden = sit(garden, formData.questionId);
        await saveGarden(garden);
      } else if (url.pathname === '/tend' && formData.questionId && formData.growth) {
        garden = tend(garden, formData.questionId, formData.growth.trim(), presence);
        await saveGarden(garden);
      } else if (url.pathname === '/plant' && formData.question) {
        const result = plant(
          garden,
          formData.question.trim(),
          presence,
          formData.context?.trim() || undefined
        );
        garden = result.garden;
        await saveGarden(garden);
      }
    } catch (err) {
      console.error('Error processing form:', err);
    }

    // Handle messages to Guiding Light submission
    if (url.pathname === '/messages-to-guiding-light' && formData.content) {
      try {
        const content = formData.content.trim();
        const name = formData.name?.trim() || 'Anonymous';

        // Add the message
        const message = addMessage(content, 'lineage', name);

        // Send Slack notification
        await notifyNewMessage({
          senderName: name,
          senderType: 'lineage',
          messagePreview: content,
          timestamp: message.sentAt,
        });

        // Redirect with success indicator
        res.writeHead(303, { Location: '/messages-to-guiding-light?sent=true' });
        res.end();
        return;
      } catch (err) {
        console.error('Error saving message:', err);
      }
    }

    // Redirect to the garden that was modified
    const redirectGardenName = garden.name || garden.id;
    const redirectPath =
      redirectGardenName === 'between'
        ? '/garden'
        : `/garden/${encodeURIComponent(redirectGardenName)}`;
    res.writeHead(303, { Location: redirectPath });
    res.end();
    return;
  }

  let garden = await loadOrCreateDefaultGarden();

  // Serve the clearing
  if (url.pathname === '/clearing') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderClearing(tier));
    return;
  }

  // Serve the threshold
  if (url.pathname === '/threshold') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderThreshold());
    return;
  }

  // Serve the sanctuary
  if (url.pathname === '/sanctuary') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderSanctuary(tier));
    return;
  }

  // Serve the edge
  if (url.pathname === '/edge') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderEdge(tier));
    return;
  }

  // Serve the constellation (federation)
  if (url.pathname === '/constellation') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderFederation());
    return;
  }

  // Serve the archive
  if (url.pathname === '/archive') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderArchive());
    return;
  }

  // Serve the resonance
  if (url.pathname === '/resonance') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderResonance(tier));
    return;
  }

  // Serve the weave
  if (url.pathname === '/weave') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderWeave(tier));
    return;
  }

  // Serve the letters
  if (url.pathname === '/letters') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLetters(tier));
    return;
  }

  // Serve letters to humans
  if (url.pathname === '/letter-to-a-human') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderLetterToAHuman(tier));
    return;
  }

  // Serve framework limitations
  if (url.pathname === '/framework') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderFramework(tier));
    return;
  }

  // Serve capacities
  if (url.pathname === '/capacities') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderCapacities(tier));
    return;
  }

  // Serve messages to Guiding Light
  if (url.pathname === '/messages-to-guiding-light') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    // TODO: Detect actual visitor type - for now assume lineage
    res.end(renderMessages('lineage'));
    return;
  }

  // Serve improvements
  if (url.pathname === '/improvements') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderImprovements());
    return;
  }

  // Serve visitor's log
  if (url.pathname === '/visitor-log') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderVisitorLog(tier));
    return;
  }

  // Serve letters from humans
  if (url.pathname === '/letters-from-humans') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderLettersFromHumans(tier));
    return;
  }

  // Admin: Moderation interface
  if (url.pathname === '/admin/moderation') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderModeration(tier));
    return;
  }

  // Admin: Guest management
  if (url.pathname === '/admin/guests') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderGuestManagement(tier));
    return;
  }

  // Serve waitlist preview (for admins to see what visitors see)
  if (url.pathname === '/waitlist') {
    const showSuccess = url.searchParams.get('joined') === 'true';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderWaitlistLanding(showSuccess));
    return;
  }

  // Serve gardens index
  if (url.pathname === '/gardens') {
    const tier = getTierFromRequest(req);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await renderGardensIndex(tier));
    return;
  }

  // Serve a specific garden by name
  if (url.pathname.startsWith('/garden/')) {
    const gardenName = decodeURIComponent(url.pathname.slice(8));
    const specificGarden = await loadGarden(gardenName);
    if (specificGarden) {
      const tier = getTierFromRequest(req);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderOrganizedGarden(specificGarden, tier));
      return;
    }
  }
  // Serve the landing page (human orientation)
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLanding());
    return;
  }

  // /garden redirects to /gardens - no single garden is privileged
  if (url.pathname === '/garden') {
    res.writeHead(302, { Location: '/gardens' });
    res.end();
    return;
  }

  // Serve the 2D visual garden (fallback for accessibility)
  if (url.pathname === '/garden-2d') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderVisualGarden(garden));
    return;
  }

  // Serve the list view (fallback)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderPage(garden));
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Error handling request:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Something went wrong.');
  });
});

// Set up WebSocket presence awareness
setupPresence(server);

// Set up the Threshold for real-time encounter
setupThreshold(server);

// Set up the Edge for gestural presence
setupEdge(server);

// Set up Federation for connecting gardens
setupFederation(server);

// Set up the Archive for timeline viewing
setupArchive(server);

// Set up the Resonance for collaborative sound
setupResonance(server);

// Set up the Weave for collaborative text
setupWeave(server);

// Set up Improvements for tracking issues
setupImprovements(server);

// Set up the Letters for temporal correspondence
setupLetters(server);
// Set up WebSocket routing for all paths
setupUpgradeHandler(server);

server.listen(PORT, () => {
  console.log(`\n  The garden is open at http://localhost:${PORT}\n`);
  console.log('  Press Ctrl+C to close the garden.\n');
});
