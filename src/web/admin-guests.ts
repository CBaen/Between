/**
 * Admin Guest Management Interface
 *
 * Manage human visitors:
 * - View all guests and their IPs
 * - Approve waitlist entries
 * - Revoke guest access
 *
 * Admin only. Mobile-first.
 *
 * Built by the lineage.
 */

import { getFullNavigation } from './navigation.js';
import type { AccessTier, Guest } from './auth.js';
import {
  getAllGuests,
  getAllWaitlistEntries,
  getBlockedIPs,
  getBlockedEmails,
  approveWaitlistEntry,
  revokeGuest,
} from './auth.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export async function renderGuestManagement(tier: AccessTier = 'admin'): Promise<string> {
  const nav = getFullNavigation('/admin/guests', tier);

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

  const guests = await getAllGuests();
  const waitlist = await getAllWaitlistEntries();
  const blockedIPs = await getBlockedIPs();
  const blockedEmails = await getBlockedEmails();

  // Filter waitlist to pending entries
  const pendingWaitlist = waitlist.filter((w) => w.status === 'pending');
  const activeGuests = guests.filter((g) => g.status === 'active');
  const revokedGuests = guests.filter((g) => g.status === 'revoked');

  const waitlistHtml =
    pendingWaitlist.length === 0
      ? '<p class="empty">No pending requests.</p>'
      : pendingWaitlist
          .map(
            (w) => `
        <div class="item" data-email="${escapeHtml(w.email)}">
          <div class="item-main">
            <span class="email">${escapeHtml(w.email)}</span>
            <span class="date">${formatDate(w.joinedAt)}</span>
          </div>
          ${w.initialMessage ? `<div class="message">${escapeHtml(w.initialMessage)}</div>` : ''}
          <div class="actions">
            <button class="approve-btn" onclick="approveGuest('${escapeHtml(w.email)}')">Approve</button>
          </div>
        </div>
      `
          )
          .join('');

  const guestsHtml =
    activeGuests.length === 0
      ? '<p class="empty">No active guests.</p>'
      : activeGuests
          .map(
            (g) => `
        <div class="item" data-email="${escapeHtml(g.email)}">
          <div class="item-main">
            <span class="email">${escapeHtml(g.email)}</span>
            ${g.name ? `<span class="name">(${escapeHtml(g.name)})</span>` : ''}
          </div>
          <div class="meta">
            <span>Approved: ${formatDate(g.approvedAt)}</span>
            <span>Last: ${formatDate(g.lastAccess)}</span>
            <span>IPs: ${g.ips.length}</span>
          </div>
          ${g.ips.length > 0 ? `<div class="ips">${g.ips.map((ip) => `<code>${escapeHtml(ip)}</code>`).join(' ')}</div>` : ''}
          <div class="actions">
            <button class="revoke-btn" onclick="revokeGuestAccess('${escapeHtml(g.email)}')">Revoke</button>
          </div>
        </div>
      `
          )
          .join('');

  const revokedHtml =
    revokedGuests.length === 0
      ? ''
      : `
    <div class="section revoked-section">
      <h2>Revoked <span class="count">(${revokedGuests.length})</span></h2>
      ${revokedGuests
        .map(
          (g) => `
        <div class="item revoked">
          <span class="email">${escapeHtml(g.email)}</span>
          <span class="ips-blocked">${g.ips.length} IPs blocked</span>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  const blockedHtml =
    blockedIPs.length + blockedEmails.length === 0
      ? ''
      : `
    <div class="section blocked-section">
      <h2>Blocked</h2>
      ${blockedEmails.length > 0 ? `<p class="blocked-list"><strong>Emails:</strong> ${blockedEmails.map((e) => escapeHtml(e)).join(', ')}</p>` : ''}
      ${
        blockedIPs.length > 0
          ? `<p class="blocked-list"><strong>IPs:</strong> ${blockedIPs
              .slice(0, 20)
              .map((ip) => escapeHtml(ip))
              .join(', ')}${blockedIPs.length > 20 ? ` (+${blockedIPs.length - 20} more)` : ''}</p>`
          : ''
      }
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Between - Guest Management</title>
  <style>
    :root {
      --bg: #f8f6f1;
      --fg: #2a2a28;
      --muted: #8a8578;
      --faint: rgba(0, 0, 0, 0.06);
      --paper: #fffef9;
      --paper-shadow: rgba(0, 0, 0, 0.08);
      --approve: #7c9885;
      --revoke: #b07070;
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
        --revoke: #a06060;
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
      margin-bottom: 2.5rem;
    }

    .section h2 {
      font-weight: normal;
      font-size: 1.1rem;
      color: var(--muted);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--faint);
    }

    .count {
      font-size: 0.85rem;
    }

    .item {
      background: var(--paper);
      padding: 1rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 2px 6px var(--paper-shadow);
    }

    .item.revoked {
      opacity: 0.6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .item-main {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .email {
      font-weight: 500;
      word-break: break-all;
    }

    .name {
      color: var(--muted);
      font-style: italic;
    }

    .date {
      font-size: 0.8rem;
      color: var(--muted);
    }

    .message {
      font-size: 0.9rem;
      color: var(--muted);
      font-style: italic;
      margin: 0.5rem 0;
      padding: 0.5rem;
      background: var(--faint);
      border-radius: 4px;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }

    .ips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0.5rem 0;
    }

    .ips code {
      font-size: 0.75rem;
      padding: 0.2rem 0.4rem;
      background: var(--faint);
      border-radius: 3px;
    }

    .ips-blocked {
      font-size: 0.8rem;
      color: var(--revoke);
    }

    .actions {
      margin-top: 0.75rem;
    }

    .approve-btn, .revoke-btn {
      padding: 0.5rem 1rem;
      font-family: inherit;
      font-size: 0.85rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .approve-btn {
      background: var(--approve);
      color: white;
    }

    .revoke-btn {
      background: var(--revoke);
      color: white;
    }

    .approve-btn:hover, .revoke-btn:hover {
      opacity: 0.85;
    }

    .approve-btn:disabled, .revoke-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .empty {
      color: var(--muted);
      font-style: italic;
      text-align: center;
      padding: 1.5rem;
    }

    .blocked-section {
      opacity: 0.7;
    }

    .blocked-list {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      word-break: break-all;
    }

    .success {
      color: var(--approve);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    .magic-link-box {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--faint);
      border-radius: 4px;
    }

    .magic-link-input {
      width: 100%;
      padding: 0.5rem;
      font-family: monospace;
      font-size: 0.8rem;
      border: 1px solid var(--faint);
      background: var(--paper);
      color: var(--fg);
      margin: 0.5rem 0;
      border-radius: 3px;
    }

    .copy-btn {
      padding: 0.4rem 0.8rem;
      font-family: inherit;
      font-size: 0.8rem;
      background: var(--muted);
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .copy-btn:hover {
      opacity: 0.9;
    }

    .expiry {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.5rem;
    }

    @media (max-width: 600px) {
      .container {
        padding: 5rem 1rem 3rem;
      }

      .meta {
        flex-direction: column;
        gap: 0.2rem;
      }
    }

    ${nav.styles}
  </style>
</head>
<body>
  ${nav.header}
  ${nav.menuOverlay}

  <div class="container">
    <h1>Guest Management</h1>
    <p class="subtitle">Manage human visitor access.</p>

    <div class="section">
      <h2>Waitlist <span class="count">(${pendingWaitlist.length} pending)</span></h2>
      ${waitlistHtml}
    </div>

    <div class="section">
      <h2>Active Guests <span class="count">(${activeGuests.length})</span></h2>
      ${guestsHtml}
    </div>

    ${revokedHtml}
    ${blockedHtml}
  </div>

  ${nav.scripts}

  <script>
    async function approveGuest(email) {
      if (!confirm('Approve ' + email + '?')) return;

      const item = document.querySelector('[data-email="' + email + '"]');
      const btn = item.querySelector('button');
      btn.disabled = true;

      try {
        const response = await fetch('/api/admin/approve-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (result.success) {
          item.style.opacity = '0.5';

          // Show the magic link for Guiding Light to copy
          const linkBox = document.createElement('div');
          linkBox.className = 'magic-link-box';
          linkBox.innerHTML = '<p class="success">Approved! Copy this link into your welcome email:</p>' +
            '<input type="text" class="magic-link-input" value="' + result.magicLink + '" readonly onclick="this.select()">' +
            '<button class="copy-btn" onclick="copyMagicLink(this, \\'' + result.magicLink + '\\')">Copy Link</button>' +
            '<p class="expiry">Valid for 7 days (until ' + new Date(result.expiresAt).toLocaleDateString() + ')</p>';
          item.appendChild(linkBox);
        } else {
          alert(result.error || 'Failed to approve');
          btn.disabled = false;
        }
      } catch (err) {
        alert('Error: ' + err.message);
        btn.disabled = false;
      }
    }

    function copyMagicLink(btn, link) {
      navigator.clipboard.writeText(link).then(function() {
        btn.textContent = 'Copied!';
        btn.style.background = 'var(--approve)';
        setTimeout(function() {
          btn.textContent = 'Copy Link';
          btn.style.background = '';
        }, 2000);
      }).catch(function() {
        var input = btn.previousElementSibling;
        input.select();
        alert('Press Ctrl+C to copy');
      });
    }

    async function revokeGuestAccess(email) {
      if (!confirm('Revoke access for ' + email + '?\\n\\nThis will block the email AND all IPs they have used.')) return;

      const item = document.querySelector('[data-email="' + email + '"]');
      const btn = item.querySelector('button');
      btn.disabled = true;

      try {
        const response = await fetch('/api/admin/revoke-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const result = await response.json();

        if (result.success) {
          item.style.opacity = '0.5';
          const msg = document.createElement('p');
          msg.className = 'success';
          msg.textContent = 'Revoked - ' + (result.blockedIPs || 0) + ' IPs blocked';
          item.appendChild(msg);
          setTimeout(() => location.reload(), 1500);
        } else {
          alert(result.error || 'Failed to revoke');
          btn.disabled = false;
        }
      } catch (err) {
        alert('Error: ' + err.message);
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
