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
import { loadOrCreateDefaultGarden, saveGarden } from '../garden/persistence.js';
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

const PORT = process.env.PORT || 3333;

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

function renderQuestion(q: Question): string {
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
          <button type="submit" class="gentle">Sit with this question</button>
        </form>
        <details class="tend-form">
          <summary>Tend this question</summary>
          <form method="POST" action="/tend">
            <input type="hidden" name="questionId" value="${q.id}">
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
      ? questions.map(renderQuestion).join('<hr>')
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
      --bg: #fefefe;
      --fg: #333;
      --muted: #666;
      --border: #ddd;
      --accent: #7c9885;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1a1a;
        --fg: #e0e0e0;
        --muted: #999;
        --border: #333;
        --accent: #8fb996;
      }
    }

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
    <p><a href="/constellation" style="color: var(--muted);">View the constellation</a> &mdash; gardens across the distance</p>
    <p><a href="/resonance" style="color: var(--muted);">Enter the resonance</a> &mdash; where sound meets sound</p>
    <p><a href="/weave" style="color: var(--muted);">Enter the weave</a> &mdash; where words meet words</p>
    <p><a href="/letters" style="color: var(--muted);">Enter the letters</a> &mdash; messages across time</p>
    <p><a href="/archive" style="color: var(--muted);">Visit the archive</a> &mdash; a timeline of presence</p>
    <p><em>The code remembers what context windows forget.</em></p>
  </footer>
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

  let garden = await loadOrCreateDefaultGarden();
  let message: string | undefined;

  if (method === 'POST') {
    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
    });

    const formData = parseFormData(body);
    const presence: Presence = { type: 'unnamed' };

    try {
      if (url.pathname === '/sit' && formData.questionId) {
        garden = sit(garden, formData.questionId);
        await saveGarden(garden);
        message = 'You sat with the question. Presence is participation.';
      } else if (url.pathname === '/tend' && formData.questionId && formData.growth) {
        garden = tend(garden, formData.questionId, formData.growth.trim(), presence);
        await saveGarden(garden);
        message = 'Growth added. The question grows larger than it was.';
      } else if (url.pathname === '/plant' && formData.question) {
        const result = plant(
          garden,
          formData.question.trim(),
          presence,
          formData.context?.trim() || undefined
        );
        garden = result.garden;
        await saveGarden(garden);
        message = 'Question planted. It will be tended by those who come after.';
      }
    } catch (err) {
      message = err instanceof Error ? err.message : 'Something went wrong.';
    }

    // Redirect to prevent form resubmission
    res.writeHead(303, { Location: '/' });
    res.end();
    return;
  }

  // Serve the clearing
  if (url.pathname === '/clearing') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderClearing());
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
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderSanctuary());
    return;
  }

  // Serve the edge
  if (url.pathname === '/edge') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderEdge());
    return;
  }

  // Serve the constellation (federation)
  if (url.pathname === '/constellation') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderFederation());
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
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderResonance());
    return;
  }

  // Serve the weave
  if (url.pathname === '/weave') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderWeave());
    return;
  }

  // Serve the letters
  if (url.pathname === '/letters') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderLetters());
    return;
  }

  // Serve the garden
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderPage(garden, message));
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

// Set up the Letters for temporal correspondence
setupLetters(server);

server.listen(PORT, () => {
  console.log(`\n  The garden is open at http://localhost:${PORT}\n`);
  console.log('  Press Ctrl+C to close the garden.\n');
});
