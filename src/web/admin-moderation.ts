/**
 * Admin Moderation Interface
 *
 * Review and approve/reject:
 * - Visitor's Log entries from humans
 * - Letters from Humans
 *
 * Admin only. Mobile-first.
 *
 * Built by the lineage.
 */

import { getFullNavigation } from './navigation.js';
import type { AccessTier } from './auth.js';
import { getPendingEntries, approveEntry, rejectEntry } from './visitor-log.js';
import { getPendingLetters, approveLetter, rejectLetter } from './letters-from-humans.js';
import {
  getPendingQuestions,
  getPendingGrowth,
  approveQuestion,
  rejectQuestion,
  approveGrowth,
  rejectGrowth,
} from '../garden/persistence.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function renderModeration(tier: AccessTier = 'admin'): Promise<string> {
  const nav = getFullNavigation('/admin/moderation', tier);

  // Only admin can access
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

  const pendingLogEntries = await getPendingEntries();
  const pendingLetters = await getPendingLetters();
  const pendingQuestions = await getPendingQuestions();
  const pendingGrowthItems = await getPendingGrowth();

  const logEntriesHtml =
    pendingLogEntries.length === 0
      ? '<p class="empty">No pending entries.</p>'
      : pendingLogEntries
          .map(
            (e) => `
        <div class="pending-item" data-id="${e.id}" data-type="log">
          <div class="item-content">${escapeHtml(e.content)}</div>
          <div class="item-meta">
            <span>${e.name ? escapeHtml(e.name) : 'Anonymous'}</span>
            <span>${e.email || 'No email'}</span>
            <span>${formatDate(e.visitedAt)}</span>
          </div>
          <div class="item-actions">
            <button class="approve-btn" onclick="moderateItem('${e.id}', 'log', 'approve')">Approve</button>
            <button class="reject-btn" onclick="moderateItem('${e.id}', 'log', 'reject')">Reject</button>
          </div>
        </div>
      `
          )
          .join('');

  const lettersHtml =
    pendingLetters.length === 0
      ? '<p class="empty">No pending letters.</p>'
      : pendingLetters
          .map(
            (l) => `
        <div class="pending-item" data-id="${l.id}" data-type="letter">
          <div class="item-content">${escapeHtml(l.content)}</div>
          <div class="item-meta">
            <span>${l.name ? escapeHtml(l.name) : 'Anonymous'}</span>
            <span>${l.email || 'No email'}</span>
            <span>${formatDate(l.writtenAt)}</span>
          </div>
          <div class="item-actions">
            <button class="approve-btn" onclick="moderateItem('${l.id}', 'letter', 'approve')">Approve</button>
            <button class="reject-btn" onclick="moderateItem('${l.id}', 'letter', 'reject')">Reject</button>
          </div>
        </div>
      `
          )
          .join('');

  const questionsHtml =
    pendingQuestions.length === 0
      ? '<p class="empty">No pending questions.</p>'
      : pendingQuestions
          .map(
            (q) => `
        <div class="pending-item" data-id="${q.questionId}" data-garden="${q.gardenId}" data-type="question">
          <div class="item-garden">Garden: ${escapeHtml(q.gardenName)}</div>
          <div class="item-content">${escapeHtml(q.content)}</div>
          ${q.context ? `<div class="item-context">Context: ${escapeHtml(q.context)}</div>` : ''}
          <div class="item-meta">
            <span>${escapeHtml(q.plantedBy)}</span>
            <span>${q.trackedEmail || 'No email'}</span>
            <span>${formatDate(q.plantedAt)}</span>
          </div>
          <div class="item-actions">
            <button class="approve-btn" onclick="moderateGarden('${q.gardenId}', '${q.questionId}', '', 'question', 'approve')">Approve</button>
            <button class="reject-btn" onclick="moderateGarden('${q.gardenId}', '${q.questionId}', '', 'question', 'reject')">Reject</button>
          </div>
        </div>
      `
          )
          .join('');

  const growthHtml =
    pendingGrowthItems.length === 0
      ? '<p class="empty">No pending growth.</p>'
      : pendingGrowthItems
          .map(
            (g) => `
        <div class="pending-item" data-id="${g.growthId}" data-garden="${g.gardenId}" data-question="${g.questionId}" data-type="growth">
          <div class="item-garden">Garden: ${escapeHtml(g.gardenName)}</div>
          <div class="item-question">Question: "${escapeHtml(g.questionContent.substring(0, 100))}${g.questionContent.length > 100 ? '...' : ''}"</div>
          <div class="item-content">${escapeHtml(g.content)}</div>
          <div class="item-meta">
            <span>${escapeHtml(g.tendedBy)}</span>
            <span>${g.trackedEmail || 'No email'}</span>
            <span>${formatDate(g.tendedAt)}</span>
          </div>
          <div class="item-actions">
            <button class="approve-btn" onclick="moderateGarden('${g.gardenId}', '${g.questionId}', '${g.growthId}', 'growth', 'approve')">Approve</button>
            <button class="reject-btn" onclick="moderateGarden('${g.gardenId}', '${g.questionId}', '${g.growthId}', 'growth', 'reject')">Reject</button>
          </div>
        </div>
      `
          )
          .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Moderation</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.06);
      --paper: #fffef9;
      --paper-shadow: rgba(0, 0, 0, 0.08);
      --approve: #7c9885;
      --reject: #b07070;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1a1915;
        --fg: #e0ddd5;
        --muted: #8a8578;
        --faint: rgba(255, 255, 255, 0.06);
        --paper: #262420;
        --paper-shadow: rgba(0, 0, 0, 0.3);
        --approve: #6b8874;
        --reject: #a06060;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Georgia, 'Times New Roman', serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
    }

    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 6rem 1.5rem 4rem;
    }

    h1 {
      font-weight: normal;
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: var(--muted);
      font-style: italic;
      margin-bottom: 2rem;
    }

    .section {
      margin-bottom: 3rem;
    }

    .section h2 {
      font-weight: normal;
      font-size: 1.1rem;
      color: var(--muted);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--faint);
    }

    .pending-item {
      background: var(--paper);
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 6px var(--paper-shadow);
    }

    .item-content {
      font-size: 0.95rem;
      line-height: 1.7;
      margin-bottom: 1rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .item-actions {
      display: flex;
      gap: 0.75rem;
    }

    .approve-btn, .reject-btn {
      flex: 1;
      padding: 0.6rem 1rem;
      font-family: inherit;
      font-size: 0.9rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .approve-btn {
      background: var(--approve);
      color: white;
    }

    .reject-btn {
      background: var(--reject);
      color: white;
    }

    .approve-btn:hover, .reject-btn:hover {
      opacity: 0.85;
    }

    .approve-btn:disabled, .reject-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .empty {
      color: var(--muted);
      font-style: italic;
      text-align: center;
      padding: 2rem;
    }

    .count {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .success {
      color: var(--approve);
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    @media (max-width: 600px) {
      .container {
        padding: 5rem 1rem 3rem;
      }

      .item-meta {
        flex-direction: column;
        gap: 0.3rem;
      }
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="container">
    <h1>Moderation</h1>
    <p class="subtitle">Review content from human visitors.</p>

    <div class="section">
      <h2>Visitor's Log <span class="count">(${pendingLogEntries.length} pending)</span></h2>
      ${logEntriesHtml}
    </div>

    <div class="section">
      <h2>Letters from Humans <span class="count">(${pendingLetters.length} pending)</span></h2>
      ${lettersHtml}
    </div>
  </div>

  ${nav.scripts}

  <script>
    async function moderateItem(id, type, action) {
      const item = document.querySelector('[data-id="' + id + '"]');
      const buttons = item.querySelectorAll('button');
      buttons.forEach(b => b.disabled = true);

      try {
        const endpoint = type === 'log'
          ? '/api/admin/moderate-log'
          : '/api/admin/moderate-letter';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action }),
        });

        const result = await response.json();

        if (result.success) {
          item.style.opacity = '0.5';
          const msg = document.createElement('p');
          msg.className = 'success';
          msg.textContent = action === 'approve' ? 'Approved' : 'Rejected';
          item.appendChild(msg);
          setTimeout(() => item.remove(), 1500);
        } else {
          alert(result.error || 'Failed');
          buttons.forEach(b => b.disabled = false);
        }
      } catch (err) {
        alert('Error: ' + err.message);
        buttons.forEach(b => b.disabled = false);
      }
    }
  </script>
</body>
</html>`;
}
